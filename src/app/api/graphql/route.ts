// src/app/api/graphql/route.ts
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema';
import { resolvers, type MyContext } from '@/graphql/resolvers';
import { NextRequest } from 'next/server';
import { GraphQLError } from 'graphql';
import { PermissionError, RateLimitError } from '@/lib/permissions';
import { checkRateLimit } from '@/services/rate-limiter';
import { logAuditEvent } from '@/lib/actions/audit-actions';
import { authenticateApiRequest } from '@/lib/api-auth';

/**
 * Calculates a heuristic-based cost for a GraphQL operation.
 * @param query The GraphQL query string.
 * @param operationName The name of the operation.
 * @returns A numerical cost for rate limiting.
 */
function getGraphQLOperationCost(query: string, operationName?: string): number {
  if (query.trim().startsWith('mutation')) {
    return 10; // Base cost for any mutation
  }

  // Heuristics for query cost based on operation name or keywords
  if (operationName) {
    const lowerOpName = operationName.toLowerCase();
    if (lowerOpName.includes('products') || lowerOpName.includes('users') || lowerOpName.includes('companies')) {
      return 5; // Fetching lists is more expensive
    }
    if (lowerOpName.includes('product') || lowerOpName.includes('user') || lowerOpName.includes('company')) {
        return 1; // Fetching a single item is cheap
    }
  }

  // Fallback for introspection or simple queries
  return 1;
}

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});

const baseHandler = startServerAndCreateNextHandler<NextRequest, MyContext>(server, {
    context: async req => {
      try {
        const { user, apiKey, company } = await authenticateApiRequest();

        const requestBody = await req.clone().json();
        const cost = getGraphQLOperationCost(requestBody.query, requestBody.operationName);
        
        await checkRateLimit(apiKey.id, company.tier, cost);

        return { user };
      } catch (error: any) {
        if (error instanceof RateLimitError) {
          throw new GraphQLError(error.message, { extensions: { code: 'TOO_MANY_REQUESTS', http: { status: 429 } } });
        }
        if (error instanceof PermissionError) {
          throw new GraphQLError(error.message || 'User is not authenticated', { extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } } });
        }
        throw new GraphQLError('Internal Server Error', { extensions: { code: 'INTERNAL_SERVER_ERROR', http: { status: 500 } } });
      }
    },
});

// Wrapper to add logging
async function handler(req: NextRequest) {
    const startTime = Date.now();
    let userIdForLogging: string | undefined;
    let requestBodyForLogging: { query?: string, operationName?: string } | undefined;

    try {
        // Light authentication just to get the user ID for logging
        const { user } = await authenticateApiRequest();
        userIdForLogging = user.id;
    } catch {
        // Request might be unauthenticated, which is fine for logging attempt
    }

    try {
        requestBodyForLogging = await req.clone().json();
    } catch {
        // Not a JSON request, or empty body.
    }

    const response = await baseHandler(req);

    if (userIdForLogging && requestBodyForLogging?.query) {
        await logAuditEvent('api.graphql.request', requestBodyForLogging.operationName || 'graphql', {
            status: response.status,
            latencyMs: Date.now() - startTime
        }, userIdForLogging);
    }
    
    return response;
}

export { handler as GET, handler as POST };

// src/app/api/graphql/route.ts
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import type { User, Company, ApiKey } from '@/types';
import { GraphQLError } from 'graphql';
import { PermissionError } from '@/lib/permissions';
import { RateLimitError } from '@/services/rate-limiter';
import { checkRateLimit } from '@/services/rate-limiter';
import { logAuditEvent } from '@/lib/actions/audit-actions';

// Define the context interface for our Apollo Server
export interface MyContext {
  user: User;
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
        const isMutation = requestBody.query?.includes('mutation');
        const cost = isMutation ? 10 : 1; 
        
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
    let requestBodyForLogging: any;

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

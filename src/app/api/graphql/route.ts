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

// Define the context interface for our Apollo Server
export interface MyContext {
  user: User;
}

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest, MyContext>(server, {
  context: async req => {
    try {
      // Step 1: Authenticate and get user/key info
      const { user, apiKey, company } = await authenticateApiRequest();

      // Step 2: Determine cost and apply rate limit
      // We need to clone the request to read the body, as it can only be read once.
      const requestBody = await req.clone().json();
      const isMutation = requestBody.query?.includes('mutation');
      const cost = isMutation ? 10 : 1; // Mutations cost more

      await checkRateLimit(apiKey.id, company.tier, cost);

      // Step 3: Return user context for resolvers
      return { user };
    } catch (error: any) {
      if (error instanceof RateLimitError) {
        throw new GraphQLError(error.message, {
          extensions: { code: 'TOO_MANY_REQUESTS', http: { status: 429 } },
        });
      }
      if (error instanceof PermissionError) {
        throw new GraphQLError(error.message || 'User is not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        });
      }
      // For any other errors during auth, treat as internal server error
      throw new GraphQLError('Internal Server Error', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          http: { status: 500 },
        },
      });
    }
  },
});

export { handler as GET, handler as POST };

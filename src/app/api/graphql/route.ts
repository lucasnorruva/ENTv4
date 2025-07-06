// src/app/api/graphql/route.ts
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import type { User } from '@/types';
import { GraphQLError } from 'graphql';
import { PermissionError } from '@/lib/permissions';
import { RateLimitError } from '@/services/rate-limiter';

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
      // Authenticate the request using the API key in the header.
      const user = await authenticateApiRequest();
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

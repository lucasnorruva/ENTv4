// src/app/api/graphql/route.ts
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import type { User } from '@/types';
import { GraphQLError } from 'graphql';

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
      // If authentication fails, we throw a specific GraphQL error.
      // This ensures that no queries or mutations can proceed without a valid user context.
      throw new GraphQLError(error.message || 'User is not authenticated', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 },
        },
      });
    }
  },
});

export { handler as GET, handler as POST };

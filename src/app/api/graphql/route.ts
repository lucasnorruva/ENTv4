// src/app/api/graphql/route.ts
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import type { User } from '@/types';

// Define the context interface for our Apollo Server
export interface MyContext {
  user: User | null;
}

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest, MyContext>(server, {
  context: async req => {
    try {
      const user = await authenticateApiRequest();
      return { user };
    } catch (error) {
      // If authentication fails, the context will have user: null.
      // Resolvers are responsible for handling this case.
      return { user: null };
    }
  },
});

export { handler as GET, handler as POST };

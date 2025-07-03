// src/graphql/resolvers.ts
import { getProducts, getProductById } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth'; // We'll need this for context/auth later
import { UserRoles } from '@/lib/constants';

// For now, we'll use a hardcoded user for context.
// In a real app, this would be derived from the request's authentication token.
const getContextUser = async () => {
  return await getCurrentUser(UserRoles.DEVELOPER);
};

export const resolvers = {
  Query: {
    products: async () => {
      const user = await getContextUser();
      return getProducts(user.id);
    },
    product: async (_: any, { id }: { id: string }) => {
      const user = await getContextUser();
      return getProductById(id, user.id);
    },
  },
};
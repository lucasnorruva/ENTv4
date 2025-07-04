// src/graphql/resolvers.ts
import {
  getProducts,
  getProductById,
  saveProduct,
  deleteProduct,
} from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';
import type { ProductFormValues } from '@/lib/schemas';

// For now, we'll use a hardcoded user for context.
// In a real app, this would be derived from the request's authentication token.
const getContextUser = async () => {
  // Use a user with sufficient permissions for creating/editing products
  return await getCurrentUser(UserRoles.SUPPLIER);
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

  Mutation: {
    createProduct: async (_: any, { input }: { input: ProductFormValues }) => {
      const user = await getContextUser();
      // The saveProduct action handles creation when no ID is passed.
      return saveProduct(input, user.id);
    },
    updateProduct: async (
      _: any,
      { id, input }: { id: string; input: ProductFormValues },
    ) => {
      const user = await getContextUser();
      // The saveProduct action handles updates when an ID is passed.
      return saveProduct(input, user.id, id);
    },
    deleteProduct: async (_: any, { id }: { id: string }) => {
      const user = await getContextUser();
      await deleteProduct(id, user.id);
      return id; // Return the ID of the deleted product
    },
  },
};

// src/graphql/resolvers.ts
import {
  getProducts,
  getProductById,
  saveProduct,
  deleteProduct,
} from '@/lib/actions/product-actions';
import {
  getCompliancePaths,
  getCompliancePathById,
} from '@/lib/actions/compliance-actions';
import { saveUser, deleteUser } from '@/lib/actions/user-actions';
import { saveCompany, deleteCompany } from '@/lib/actions/company-actions';
import {
  getUsers,
  getUserById,
  getCompanies,
  getCompanyById,
  getUsersByCompanyId,
} from '@/lib/auth';
import { GraphQLError } from 'graphql';
import type {
  ProductFormValues,
  UserFormValues,
  CompanyFormValues,
} from '@/lib/schemas';
import type { User, Product, CompliancePath, Company } from '@/types';

// Define the context interface for our Apollo Server
export interface MyContext {
  user: User;
}

// Helper to check for authenticated user in context.
const checkAuth = (context: MyContext): User => {
  if (!context.user) {
    // This check is a safeguard, but the context factory should already have thrown.
    throw new GraphQLError('User is not authenticated', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  return context.user;
};

export const resolvers = {
  Query: {
    products: async (
      _: any,
      args: { limit?: number; offset?: number; filter?: Record<string, any> },
      context: MyContext,
    ) => {
      const user = checkAuth(context);
      const products = await getProducts(user.id, args.filter || {});

      // Pagination
      const offset = args.offset || 0;
      const limit = args.limit || products.length;
      return products.slice(offset, offset + limit);
    },
    product: async (_: any, { id }: { id: string }, context: MyContext) => {
      const user = checkAuth(context);
      const product = await getProductById(id, user.id);
      if (!product) {
        throw new GraphQLError('Product not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return product;
    },
    users: async (
      _: any,
      args: { limit?: number; offset?: number },
      context: MyContext,
    ) => {
      checkAuth(context);
      const allUsers = await getUsers();
      const offset = args.offset || 0;
      const limit = args.limit || allUsers.length;
      return allUsers.slice(offset, offset + limit);
    },
    user: async (_: any, { id }: { id: string }, context: MyContext) => {
      checkAuth(context);
      return getUserById(id);
    },
    companies: async (
      _: any,
      args: { limit?: number; offset?: number },
      context: MyContext,
    ) => {
      checkAuth(context);
      const allCompanies = await getCompanies();
      const offset = args.offset || 0;
      const limit = args.limit || allCompanies.length;
      return allCompanies.slice(offset, offset + limit);
    },
    company: async (_: any, { id }: { id: string }, context: MyContext) => {
      checkAuth(context);
      return getCompanyById(id);
    },
    compliancePaths: async (_: any, __: any, context: MyContext) => {
      checkAuth(context);
      return getCompliancePaths();
    },
  },

  Mutation: {
    createProduct: async (
      _: any,
      { input }: { input: ProductFormValues },
      context: MyContext,
    ) => {
      const user = checkAuth(context);
      return saveProduct(input, user.id);
    },
    updateProduct: async (
      _: any,
      { id, input }: { id: string; input: ProductFormValues },
      context: MyContext,
    ) => {
      const user = checkAuth(context);
      return saveProduct(input, user.id, id);
    },
    deleteProduct: async (
      _: any,
      { id }: { id: string },
      context: MyContext,
    ) => {
      const user = checkAuth(context);
      await deleteProduct(id, user.id);
      return id;
    },
    createUser: async (
      _: any,
      { input }: { input: UserFormValues },
      context: MyContext,
    ) => {
      const adminUser = checkAuth(context);
      return saveUser(input, adminUser.id);
    },
    updateUser: async (
      _: any,
      { id, input }: { id: string; input: UserFormValues },
      context: MyContext,
    ) => {
      const adminUser = checkAuth(context);
      return saveUser(input, adminUser.id, id);
    },
    deleteUser: async (_: any, { id }: { id: string }, context: MyContext) => {
      const adminUser = checkAuth(context);
      await deleteUser(id, adminUser.id);
      return id;
    },
    createCompany: async (
      _: any,
      { input }: { input: CompanyFormValues },
      context: MyContext,
    ) => {
      const adminUser = checkAuth(context);
      return saveCompany(input, adminUser.id);
    },
    updateCompany: async (
      _: any,
      { id, input }: { id: string; input: CompanyFormValues },
      context: MyContext,
    ) => {
      const adminUser = checkAuth(context);
      return saveCompany(input, adminUser.id, id);
    },
    deleteCompany: async (
      _: any,
      { id }: { id: string },
      context: MyContext,
    ) => {
      const adminUser = checkAuth(context);
      await deleteCompany(id, adminUser.id);
      return id;
    },
  },

  Product: {
    compliancePath: async (
      parent: Product,
    ): Promise<CompliancePath | null> => {
      if (!parent.compliancePathId) return null;
      const path = await getCompliancePathById(parent.compliancePathId);
      return path || null;
    },
    company: async (parent: Product): Promise<Company | null> => {
      if (!parent.companyId) return null;
      const company = await getCompanyById(parent.companyId);
      return company || null;
    },
  },
  User: {
    company: async (parent: User): Promise<Company | null> => {
      if (!parent.companyId) return null;
      const company = await getCompanyById(parent.companyId);
      return company || null;
    },
  },
  Company: {
    users: async (parent: Company): Promise<User[]> => {
      return getUsersByCompanyId(parent.id);
    },
    products: async (parent: Company, _: any, context: MyContext) => {
      const user = checkAuth(context);
      // Ensure the user has permission to see products from this company.
      // This is a simplified check; a real app might have more complex logic.
      if (user.companyId === parent.id || user.roles.includes('Admin')) {
        const allProducts = await getProducts(user.id);
        return allProducts.filter(p => p.companyId === parent.id);
      }
      return [];
    },
  },
};

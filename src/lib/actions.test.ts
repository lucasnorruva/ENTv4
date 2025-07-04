// src/lib/actions.test.ts
import { getProducts, getProductById, saveProduct, deleteProduct } from './actions';
import { products as mockProductsData } from './data';
import { users as mockUsersData } from './user-data';
import * as admin from 'firebase-admin';
import { checkPermission, PermissionError } from './permissions';
import { UserRoles } from './constants';

// --- MOCKS ---

// Mock the entire permissions module
jest.mock('./permissions', () => ({
  checkPermission: jest.fn(),
  PermissionError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PermissionError';
    }
  },
}));

// Mock the entire auth module
jest.mock('./auth', () => ({
  getUserById: jest.fn(async (userId) => mockUsersData.find(u => u.id === userId)),
}));

// Mock the Firebase Admin SDK
jest.mock('./firebase-admin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const { adminDb } = require('./firebase-admin');
const mockedCheckPermission = checkPermission as jest.Mock;


// --- TEST SUITE ---

describe('Product Actions (Firestore)', () => {
  let products: any[];
  
  beforeEach(() => {
    // Deep copy mock data to prevent tests from interfering with each other
    products = JSON.parse(JSON.stringify(mockProductsData));
    jest.clearAllMocks();
  });

  // Test getProductById
  describe('getProductById', () => {
    it('should return a product if it exists', async () => {
      const product = products[0];
      adminDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => product,
      });

      const result = await getProductById(product.id, 'user-admin');
      expect(result).toEqual(product);
      expect(adminDb.collection).toHaveBeenCalledWith('products');
      expect(adminDb.doc).toHaveBeenCalledWith(product.id);
    });

    it('should return undefined if the product does not exist', async () => {
      adminDb.collection().doc().get.mockResolvedValue({ exists: false });
      const result = await getProductById('non-existent-id', 'user-admin');
      expect(result).toBeUndefined();
    });

    it('should return undefined for a draft product if no user is provided', async () => {
        const draftProduct = products.find((p:any) => p.status === 'Draft');
        adminDb.collection().doc().get.mockResolvedValue({
          exists: true,
          data: () => draftProduct,
        });
        const result = await getProductById(draftProduct.id);
        expect(result).toBeUndefined();
      });
  });

  // Test getProducts
  describe('getProducts', () => {
    it('should return only published products for unauthenticated access', async () => {
        const published = products.filter(p => p.status === 'Published');
        adminDb.collection().where().get.mockResolvedValue({
            docs: published.map((p: any) => ({ data: () => p })),
        });

        const result = await getProducts();

        expect(result.length).toBe(published.length);
        expect(adminDb.collection).toHaveBeenCalledWith('products');
        expect(adminDb.where).toHaveBeenCalledWith('status', '==', 'Published');
    });

    it('should return all products for an admin user', async () => {
        adminDb.collection().orderBy().get.mockResolvedValue({
            docs: products.map((p: any) => ({ data: () => p })),
        });
        
        const result = await getProducts('user-admin');

        expect(result.length).toBe(products.length);
        expect(adminDb.where).not.toHaveBeenCalled(); // No 'where' clause for admin
    });

    it('should return only company-specific products for a supplier', async () => {
        const supplier = mockUsersData.find(u => u.roles.includes(UserRoles.SUPPLIER))!;
        const companyProducts = products.filter(p => p.companyId === supplier.companyId);

        adminDb.collection().where().orderBy().get.mockResolvedValue({
            docs: companyProducts.map((p: any) => ({ data: () => p })),
        });

        const result = await getProducts(supplier.id);

        expect(result.length).toBe(companyProducts.length);
        expect(adminDb.where).toHaveBeenCalledWith('companyId', '==', supplier.companyId);
    });
  });

  // Test saveProduct
  describe('saveProduct', () => {
    it('should create a new product if no ID is provided', async () => {
      const newProductData = { productName: 'New Test Product', productDescription: 'Desc', category: 'Test', status: 'Draft' };
      const supplier = mockUsersData.find(u => u.roles.includes(UserRoles.SUPPLIER))!;

      // Mock the add operation to return a document reference
      adminDb.collection().add.mockResolvedValue({ id: 'new-id' });
      // Mock the subsequent get operation
      adminDb.collection().doc('new-id').get.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'new-id', ...newProductData }),
      });

      const result = await saveProduct(newProductData as any, supplier.id);
      
      expect(mockedCheckPermission).toHaveBeenCalledWith(expect.anything(), 'product:create');
      expect(adminDb.collection).toHaveBeenCalledWith('products');
      expect(adminDb.add).toHaveBeenCalled();
      expect(result.productName).toBe('New Test Product');
    });

    it('should update an existing product if an ID is provided', async () => {
      const productToUpdate = products[0];
      const updatedData = { ...productToUpdate, productName: 'Updated Name' };
      const supplier = mockUsersData.find(u => u.companyId === productToUpdate.companyId)!;
      
      adminDb.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => productToUpdate,
      });

      await saveProduct(updatedData, supplier.id, productToUpdate.id);
      
      expect(mockedCheckPermission).toHaveBeenCalledWith(expect.anything(), 'product:edit', productToUpdate);
      expect(adminDb.collection).toHaveBeenCalledWith('products');
      expect(adminDb.doc).toHaveBeenCalledWith(productToUpdate.id);
      expect(adminDb.update).toHaveBeenCalledWith(expect.objectContaining({ productName: 'Updated Name' }));
    });

    it('should throw permission error if user cannot edit', async () => {
        const productToUpdate = products[0];
        const supplierFromDifferentCompany = mockUsersData.find(u => u.companyId !== productToUpdate.companyId)!;
        
        mockedCheckPermission.mockImplementation((user, action, resource) => {
            if (action === 'product:edit' && user.companyId !== resource.companyId) {
                throw new PermissionError('Permission denied');
            }
        });

        adminDb.collection().doc().get.mockResolvedValue({
            exists: true,
            data: () => productToUpdate,
          });

        await expect(saveProduct(productToUpdate, supplierFromDifferentCompany.id, productToUpdate.id)).rejects.toThrow(PermissionError);
    });
  });
  
  // Test deleteProduct
  describe('deleteProduct', () => {
    it('should delete a product if user has permission', async () => {
        const productToDelete = products[0];
        const owner = mockUsersData.find(u => u.companyId === productToDelete.companyId)!;
        
        adminDb.collection().doc().get.mockResolvedValue({
            exists: true,
            data: () => productToDelete,
        });

        await deleteProduct(productToDelete.id, owner.id);
        
        expect(mockedCheckPermission).toHaveBeenCalledWith(expect.anything(), 'product:delete', productToDelete);
        expect(adminDb.collection).toHaveBeenCalledWith('products');
        expect(adminDb.doc).toHaveBeenCalledWith(productToDelete.id);
        expect(adminDb.delete).toHaveBeenCalled();
    });

    it('should throw an error if user does not have permission to delete', async () => {
        const productToDelete = products[0];
        const nonOwner = mockUsersData.find(u => u.companyId !== productToDelete.companyId)!;

        mockedCheckPermission.mockImplementation(() => {
            throw new PermissionError('Permission denied');
        });

        adminDb.collection().doc().get.mockResolvedValue({
            exists: true,
            data: () => productToDelete,
        });

        await expect(deleteProduct(productToDelete.id, nonOwner.id)).rejects.toThrow(PermissionError);
    });
  });
});

// src/lib/actions.test.ts
import { getProducts, getProductById } from './actions';
import { products as mockProducts } from './data';
import { users as mockUsers } from './user-data';
import * as admin from 'firebase-admin';

// Mock the Firebase Admin SDK
jest.mock('./firebase-admin', () => {
  const originalModule = jest.requireActual('./firebase-admin');
  // Mock only the parts needed for the tests
  return {
    ...originalModule,
    adminDb: {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn(),
    },
  };
});

// Mock the auth module to control the "current user"
jest.mock('./auth', () => ({
  ...jest.requireActual('./auth'),
  getUserById: jest.fn(async (userId) => mockUsers.find(u => u.id === userId)),
}));

const { adminDb } = require('./firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');


// Helper to mock a Firestore document snapshot
const mockDoc = (data: any) => ({
  id: data.id,
  exists: true,
  data: () => ({ ...data, createdAt: Timestamp.fromDate(new Date(data.createdAt)) }),
});

// Helper to mock a Firestore collection snapshot
const mockCollection = (data: any[]) => ({
  empty: data.length === 0,
  docs: data.map(mockDoc),
});


describe('Product Actions', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('getProducts should return all products', async () => {
    adminDb.get.mockResolvedValue(mockCollection(mockProducts));
    const products = await getProducts();
    expect(products.length).toBe(mockProducts.length);
    expect(products[0].productName).toBe(mockProducts[0].productName);
    expect(adminDb.collection).toHaveBeenCalledWith('products');
  });

  it('getProductById should return a published product when no user is provided', async () => {
    const publishedProduct = mockProducts.find(p => p.status === 'Published');
    if (!publishedProduct) throw new Error("No published product in mock data");
    
    adminDb.get.mockResolvedValue(mockDoc(publishedProduct));
    const product = await getProductById(publishedProduct.id);
    
    expect(product).toBeDefined();
    expect(product?.id).toBe(publishedProduct.id);
    expect(adminDb.doc).toHaveBeenCalledWith(publishedProduct.id);
  });

  it('getProductById should return undefined for a draft product when no user is provided', async () => {
    const draftProduct = mockProducts.find(p => p.status === 'Draft');
    if (!draftProduct) throw new Error("No draft product in mock data");

    adminDb.get.mockResolvedValue(mockDoc(draftProduct));
    const product = await getProductById(draftProduct.id);
    
    expect(product).toBeUndefined();
    expect(adminDb.doc).toHaveBeenCalledWith(draftProduct.id);
  });
  
  it('getProductById should return a draft product to an authorized user', async () => {
    const draftProduct = mockProducts.find(p => p.status === 'Draft');
    if (!draftProduct) throw new Error("No draft product in mock data");
    
    const owner = mockUsers.find(u => u.companyId === draftProduct.companyId);
    if (!owner) throw new Error("No owner found for draft product");

    adminDb.get.mockResolvedValue(mockDoc(draftProduct));
    const product = await getProductById(draftProduct.id, owner.id);
    
    expect(product).toBeDefined();
    expect(product?.id).toBe(draftProduct.id);
  });
  
  it('getProductById should return undefined when an invalid ID is provided', async () => {
    adminDb.get.mockResolvedValue({ exists: false });
    const product = await getProductById('invalid-id');
    expect(product).toBeUndefined();
  });
});

// src/lib/actions.test.ts

import { getProducts, getProductById } from "./actions";

// Mock the firebase-admin module to avoid actual database calls
// We are mocking the return value of adminDb to control the test data.
const mockGet = jest.fn();
jest.mock('./firebase-admin', () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: mockGet,
      })),
      orderBy: jest.fn(() => ({
        get: mockGet,
      })),
    })),
  },
}));

// A helper to create a mock Firestore DocumentSnapshot
const createMockDoc = (data: any) => ({
  id: data.id,
  exists: true,
  data: () => data,
  // Add a toDate method for timestamp fields
  get: (field: string) => {
    if (data[field] && data[field].toDate) {
      return data[field];
    }
    return data[field];
  },
  ...data,
  createdAt: { toDate: () => new Date(data.createdAt) },
  updatedAt: { toDate: () => new Date(data.updatedAt) },
  lastUpdated: { toDate: () => new Date(data.lastUpdated) },
});


describe("Product Actions (with Firestore mock)", () => {
  
  afterEach(() => {
    // Clear all mock implementations and calls after each test
    jest.clearAllMocks();
  });

  describe("getProducts", () => {
    it("should return all mock products from Firestore", async () => {
      const mockProductsData = [
        { id: 'pp-001', productName: 'Test Product 1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastUpdated: new Date().toISOString() },
        { id: 'pp-002', productName: 'Test Product 2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastUpdated: new Date().toISOString() },
      ];
      // Mock the get() call to return our mock data
      mockGet.mockResolvedValue({
        empty: false,
        docs: mockProductsData.map(createMockDoc),
      });

      const products = await getProducts();
      
      expect(products.length).toBe(mockProductsData.length);
      expect(products[0].productName).toBe(mockProductsData[0].productName);
    });

     it("should return an empty array when no products are in the collection", async () => {
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });
      const products = await getProducts();
      expect(products).toEqual([]);
    });
  });

  describe("getProductById", () => {
    it("should return a specific product when a valid ID is provided", async () => {
      const mockProduct = { id: 'pp-001', productName: 'Specific Product', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastUpdated: new Date().toISOString() };
      mockGet.mockResolvedValue(createMockDoc(mockProduct));

      const product = await getProductById('pp-001');

      expect(product).toBeDefined();
      expect(product?.id).toBe('pp-001');
      expect(product?.productName).toBe('Specific Product');
    });

    it("should return undefined when an invalid ID is provided", async () => {
       mockGet.mockResolvedValue({
        exists: false,
      });

      const product = await getProductById("invalid-product-id");
      expect(product).toBeUndefined();
    });
  });
});

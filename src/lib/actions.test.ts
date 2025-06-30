// src/lib/actions.test.ts

import { getProducts, getProductById } from './actions';
import { adminDb } from './firebase-admin';

// Mock the entire firebase-admin module
jest.mock('./firebase-admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

// A helper to create a mock Firestore DocumentSnapshot
const createMockDoc = (data: any) => ({
  id: data.id,
  exists: true,
  data: () => data,
  get: (field: string) => data[field],
});

// A helper to create a mock Firestore QuerySnapshot
const createMockQuerySnapshot = (docs: any[]) => ({
  empty: docs.length === 0,
  docs: docs.map(createMockDoc),
});

describe('Product Actions (with Firestore mock)', () => {
  let collectionMock: jest.Mock;
  let docMock: jest.Mock;
  let getMock: jest.Mock;
  let whereMock: jest.Mock;
  let orderByMock: jest.Mock;

  beforeEach(() => {
    // Set up a chain of mocks for Firestore calls
    getMock = jest.fn();
    docMock = jest.fn(() => ({ get: getMock }));
    whereMock = jest.fn(() => ({ get: getMock }));
    orderByMock = jest.fn(() => ({ get: getMock, where: whereMock }));

    collectionMock = jest.fn(() => ({
      doc: docMock,
      get: getMock,
      where: whereMock,
      orderBy: orderByMock,
    }));
    (adminDb.collection as jest.Mock) = collectionMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return all mock products from Firestore', async () => {
      const mockProductsData = [
        { id: 'pp-001', productName: 'Test Product 1' },
        { id: 'pp-002', productName: 'Test Product 2' },
      ];
      getMock.mockResolvedValue(createMockQuerySnapshot(mockProductsData));

      const products = await getProducts();

      expect(collectionMock).toHaveBeenCalledWith('products');
      expect(orderByMock).toHaveBeenCalledWith('createdAt', 'desc');
      expect(products.length).toBe(mockProductsData.length);
      expect(products[0].productName).toBe(mockProductsData[0].productName);
    });

    it('should return an empty array when no products are in the collection', async () => {
      getMock.mockResolvedValue(createMockQuerySnapshot([]));
      const products = await getProducts();
      expect(products).toEqual([]);
    });
  });

  describe('getProductById', () => {
    it('should return a specific published product when a valid ID is provided without a user', async () => {
      const mockProduct = {
        id: 'pp-001',
        productName: 'Specific Product',
        status: 'Published',
      };
      getMock.mockResolvedValue(createMockDoc(mockProduct));

      const product = await getProductById('pp-001');

      expect(docMock).toHaveBeenCalledWith('pp-001');
      expect(product).toBeDefined();
      expect(product?.id).toBe('pp-001');
      expect(product?.productName).toBe('Specific Product');
    });

    it('should return undefined for a draft product when no user is provided', async () => {
        const mockProduct = {
          id: 'pp-001',
          productName: 'Draft Product',
          status: 'Draft',
        };
        getMock.mockResolvedValue(createMockDoc(mockProduct));
  
        const product = await getProductById('pp-001');
        expect(product).toBeUndefined();
    });

    it('should return undefined when an invalid ID is provided', async () => {
      getMock.mockResolvedValue({ exists: false });
      const product = await getProductById('invalid-product-id');
      expect(product).toBeUndefined();
    });
  });
});

// src/lib/actions.test.ts
import { getProducts, getProductById } from './actions';
import { products as mockProducts } from './data';
import { users as mockUsers } from './user-data';

// Mock the auth module to control the "current user"
jest.mock('./auth', () => ({
  ...jest.requireActual('./auth'),
  getUserById: jest.fn(async (userId) => mockUsers.find(u => u.id === userId)),
}));

describe('Product Actions (with mock data)', () => {
  it('should return all mock products', async () => {
    const products = await getProducts();
    expect(products.length).toBe(mockProducts.length);
    expect(products[0].productName).toBe(mockProducts[0].productName);
  });

  it('should return a specific published product when a valid ID is provided without a user', async () => {
    // Find a published product in our mock data to test against
    const publishedProduct = mockProducts.find(p => p.status === 'Published');
    if (!publishedProduct) {
      throw new Error('No published products in mock data to test with.');
    }
    
    const product = await getProductById(publishedProduct.id);
    expect(product).toBeDefined();
    expect(product?.id).toBe(publishedProduct.id);
    expect(product?.productName).toBe(publishedProduct.productName);
  });

  it('should return undefined for a draft product when no user is provided', async () => {
    const draftProduct = mockProducts.find(p => p.status === 'Draft');
    if (!draftProduct) {
      throw new Error('No draft products in mock data to test with.');
    }

    const product = await getProductById(draftProduct.id);
    expect(product).toBeUndefined();
  });

  it('should return undefined when an invalid ID is provided', async () => {
    const product = await getProductById('invalid-product-id');
    expect(product).toBeUndefined();
  });
});

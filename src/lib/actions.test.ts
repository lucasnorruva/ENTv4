// src/lib/actions.test.ts

import { getProducts, getProductById } from "./actions";
import { products as mockProductsData } from "./data";

// This test suite validates the data-accessing server actions.
// In a real application with a database, these tests would be
// integration tests run against a test database instance
// (e.g., a local Firestore emulator).

describe("Product Actions", () => {
  // Use a mutable copy of mock data for tests to avoid side-effects
  let mockProducts: typeof mockProductsData;

  beforeEach(() => {
    // Reset mock data before each test
    mockProducts = JSON.parse(JSON.stringify(mockProductsData));
    jest.spyOn(require("./data"), "products", "get").mockReturnValue(mockProducts);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getProducts", () => {
    it("should return all mock products", async () => {
      const products = await getProducts();
      // We expect the action to return the same number of products as our mock data source.
      expect(products.length).toBe(mockProducts.length);
      // It should also contain the same product IDs.
      expect(products.map((p) => p.id)).toEqual(
        expect.arrayContaining(mockProducts.map((p) => p.id)),
      );
    });
  });

  describe("getProductById", () => {
    it("should return a specific product when a valid ID is provided", async () => {
      // Use the ID of the first product in our mock data for a guaranteed hit.
      const firstProductId = mockProducts[0].id;
      const product = await getProductById(firstProductId);

      // The product should be defined and have the correct ID and name.
      expect(product).toBeDefined();
      expect(product?.id).toBe(firstProductId);
      expect(product?.productName).toBe(mockProducts[0].productName);
    });

    it("should return undefined when an invalid ID is provided", async () => {
      const invalidId = "invalid-product-id";
      const product = await getProductById(invalidId);

      // The result should be undefined for a non-existent product.
      expect(product).toBeUndefined();
    });
  });
});

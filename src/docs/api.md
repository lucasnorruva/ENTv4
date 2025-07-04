# Norruva API Documentation

The Norruva API provides programmatic access to create, manage, and verify Digital Product Passports. We offer multiple API styles to suit different use cases, with a strong recommendation for our GraphQL API for its power and flexibility.

## Authentication

All API requests must be authenticated using an API key. Include your key in the `Authorization` header:

`Authorization: Bearer YOUR_API_KEY`

---

## GraphQL API (Recommended)

For complex data retrieval and mutations, our GraphQL API is the most powerful and efficient way to interact with the Norruva platform. It allows you to fetch exactly the data you need in a single request, reducing latency and simplifying client-side logic.

- **Endpoint**: `/api/graphql`
- **Method**: `POST`

Our GraphQL endpoint supports introspection, so you can explore the full schema using tools like Postman, Apollo Studio, or Insomnia.

### Example Query: Fetch Products with Company Info

This query retrieves all products and, for each product, fetches details about its parent company.

```graphql
query GetProductsWithCompany {
  products {
    id
    productName
    status
    company {
      id
      name
      industry
    }
  }
}
```

### Example Query: Fetch a Company and its Users

This query retrieves a specific company by its ID and lists all users associated with it, demonstrating how to use variables.

```graphql
query GetCompanyUsers($companyId: ID!) {
  company(id: $companyId) {
    id
    name
    users {
      id
      fullName
      email
      roles
    }
  }
}
```
**Variables:**
```json
{
  "companyId": "comp-eco"
}
```

### Example Mutation: Create a Product

This mutation creates a new product with basic information. The `ProductInput` type includes all fields necessary to create a detailed passport.

```graphql
mutation CreateNewProduct($input: ProductInput!) {
  createProduct(input: $input) {
    id
    productName
    status
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "productName": "My New GraphQL Product",
    "productDescription": "A product created via the GraphQL API.",
    "category": "Electronics",
    "status": "Draft",
    "materials": [
      {
        "name": "Recycled Aluminum",
        "percentage": 75
      }
    ]
  }
}
```
---

## REST API v2 (Current)

This is the recommended version for all new RESTful integrations. All endpoints are prefixed with `/api/v2`.

### Products

#### `GET /api/v2/products`
Retrieves a list of all product passports for your organization.
... (rest of the content is similar to existing)

---

## REST API v1 (Legacy)

**This version is deprecated and will be removed in a future release.** Please migrate to the v2 or GraphQL API for new integrations. All endpoints are prefixed with `/api/v1`.

### Products

#### `GET /api/v1/products`
Retrieves a list of all product passports for your organization.

### Compliance

#### `POST /api/v1/compliance/check/{productId}`
Triggers an on-demand, asynchronous compliance check for a specific product.

---
_This is a preliminary version of the API documentation. More endpoints will be added._

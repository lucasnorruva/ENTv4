# Norruva API Documentation

The Norruva API provides programmatic access to create, manage, and verify Digital Product Passports. We offer multiple API styles to suit different use cases.

## Authentication

All API requests must be authenticated using an API key. Include your key in the `Authorization` header:

`Authorization: Bearer YOUR_API_KEY`

---

## GraphQL API (Recommended)

For complex data retrieval, such as fetching a product along with its full compliance history and nested materials in a single request, we recommend our GraphQL API.

- **Endpoint**: `/api/graphql`
- **Method**: `POST`

You can use a GraphQL client to interact with this endpoint. It supports introspection, so you can explore the full schema using tools like Postman or Apollo Studio.

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

This query retrieves a specific company by its ID and lists all users associated with it.

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

### Example Mutation: Create a Product

This mutation creates a new product with basic information.

```graphql
mutation CreateNewProduct($input: ProductInput!) {
  createProduct(input: $input) {
    id
    productName
    status
    createdAt
  }
}

# Variables for the mutation:
# {
#   "input": {
#     "productName": "My New GraphQL Product",
#     "productDescription": "A product created via the GraphQL API.",
#     "category": "Electronics",
#     "status": "Draft"
#   }
# }
```

---

## REST API v2 (Current)

This is the recommended version for all new RESTful integrations. All endpoints are prefixed with `/api/v2`.

### Products

#### `GET /api/v2/products`

Retrieves a list of all product passports for your organization.

-   **Method**: `GET`
-   **Query Parameters**:
    -   `status`: (Optional) Filter by `Published`, `Draft`, or `Archived`.
    -   `category`: (Optional) Filter by product category.
-   **Success Response**: `200 OK`
    ```json
    [
      {
        "id": "pp-001",
        "productName": "Eco-Friendly Smart Watch",
        "status": "Published",
        "...",
        "_links": {
          "self": { "href": "/api/v2/products/pp-001" }
        }
      }
    ]
    ```

#### `POST /api/v2/products`

Creates a new product passport.

-   **Method**: `POST`
-   **Body**: A valid `Product` object. See the GraphQL schema for available fields.
-   **Success Response**: `201 Created`
    ```json
    {
      "id": "pp-new-123",
      "productName": "New Product",
      "status": "Draft",
      "...",
       "_links": {
          "self": { "href": "/api/v2/products/pp-new-123" }
        }
    }
    ```

#### `GET /api/v2/products/{id}`

Retrieves a single product passport by its ID.

-   **Method**: `GET`
-   **Success Response**: `200 OK`
-   **Error Response**: `404 Not Found` if product doesn't exist or you don't have access.

#### `PUT /api/v2/products/{id}`

Updates an existing product passport.

-   **Method**: `PUT`
-   **Body**: Partial `Product` object with fields to update.
-   **Success Response**: `200 OK`
-   **Error Response**: `400 Bad Request` if data is invalid, `404 Not Found` if product doesn't exist.

#### `DELETE /api/v2/products/{id}`

Deletes a product passport.

-   **Method**: `DELETE`
-   **Success Response**: `204 No Content`
-   **Error Response**: `404 Not Found` if product doesn't exist.

---

## REST API v1 (Legacy)

This version is being phased out. Please use v2 for new integrations. All endpoints are prefixed with `/api/v1`.

### Products

#### `GET /api/v1/products`

Retrieves a list of all product passports for your organization.

-   **Method**: `GET`
-   **Query Parameters**:
    -   `status`: (Optional) Filter by `Published`, `Draft`, or `Archived`.
    -   `category`: (Optional) Filter by product category.
-   **Success Response**: `200 OK`

#### `POST /api/v1/products`

Creates a new product passport.

-   **Method**: `POST`
-   **Body**: A valid `Product` object.
-   **Success Response**: `201 Created`

### Compliance

#### `POST /api/v1/compliance/check/{productId}`

Triggers an on-demand, asynchronous compliance check for a specific product.

-   **Method**: `POST`
-   **URL Parameters**:
    -   `productId`: The ID of the product to check.
-   **Success Response**: `202 Accepted`

---
_This is a preliminary version of the API documentation. More endpoints will be added._

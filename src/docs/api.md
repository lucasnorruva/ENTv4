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

### Example Query: Fetch Filtered & Paginated Products

This query retrieves the first 10 'Electronics' products, including their company details.

```graphql
query GetElectronicsProducts {
  products(limit: 10, offset: 0, filter: { category: "Electronics" }) {
    id
    productName
    status
    category
    company {
      id
      name
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

### Example Mutation: Create a User

This mutation creates a new user and assigns them to a company.

```graphql
mutation CreateNewUser($input: UserInput!) {
  createUser(input: $input) {
    id
    fullName
    email
    roles
    company {
      id
      name
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "fullName": "API User",
    "email": "api.user@example.com",
    "companyId": "comp-eco",
    "roles": ["Supplier"]
  }
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

This is the recommended version for all new RESTful integrations. All endpoints are prefixed with `/api/v2`. Responses include HATEOAS `_links` for easier API navigation.

### Products

#### `GET /api/v2/products`

Retrieves a list of all product passports accessible to the authenticated user.

- **Method**: `GET`
- **Query Parameters**:
    -   `status`: (Optional) Filter by `Published`, `Draft`, or `Archived`.
    -   `category`: (Optional) Filter by product category.
-   **Success Response**: `200 OK`
    ```json
    [
      {
        "id": "pp-001",
        "productName": "Eco-Friendly Smart Watch",
        "status": "Published",
        "_links": {
          "self": { "href": "/api/v2/products/pp-001" }
        },
        "..."
      }
    ]
    ```

#### `POST /api/v2/products`

Creates a new product passport.

-   **Method**: `POST`
-   **Body**: A JSON object matching the `ProductInput` schema from GraphQL.
-   **Success Response**: `201 Created`
    ```json
    {
      "id": "pp-new-123",
      "productName": "New Product",
      "status": "Draft",
      "_links": {
          "self": { "href": "/api/v2/products/pp-new-123" }
      },
      "..."
    }
    ```

#### `GET /api/v2/products/{id}`

Retrieves a single product passport by its ID.

-   **Method**: `GET`
-   **Success Response**: `200 OK`
    ```json
    {
      "id": "pp-001",
      "productName": "Eco-Friendly Smart Watch",
      "..."
    }
    ```

#### `PUT /api/v2/products/{id}`

Updates an existing product passport.

-   **Method**: `PUT`
-   **Body**: A JSON object with the fields to update.
-   **Success Response**: `200 OK`

#### `DELETE /api/v2/products/{id}`

Deletes a product passport.

-   **Method**: `DELETE`
-   **Success Response**: `204 No Content`

---

## REST API v1 (Legacy & Deprecated)

**This version is deprecated and will be removed in a future release.** Please migrate to the v2 or GraphQL API for new integrations. All endpoints are prefixed with `/api/v1`.

### Products

#### `GET /api/v1/products`
Retrieves a list of all product passports for your organization.

### Compliance

#### `POST /api/v1/compliance/check/{productId}`
Triggers an on-demand, asynchronous compliance check for a specific product.

---
_This is a preliminary version of the API documentation. More endpoints will be added._

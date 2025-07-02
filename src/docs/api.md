# Norruva REST API Documentation

The Norruva API provides programmatic access to create, manage, and verify Digital Product Passports. All endpoints are prefixed with `/api/v1`.

## Authentication

All API requests must be authenticated using an API key. Include your key in the `Authorization` header:

`Authorization: Bearer YOUR_API_KEY`

---

## Endpoints

### Products

#### `GET /api/v1/products`

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
        "..."
      }
    ]
    ```

#### `POST /api/v1/products`

Creates a new product passport.

-   **Method**: `POST`
-   **Body**: `Product` object (without `id` or timestamps).
-   **Success Response**: `201 Created`
    ```json
    {
      "id": "pp-new-123",
      "productName": "New Product",
      "status": "Draft",
      "..."
    }
    ```

#### `GET /api/v1/products/{id}`

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
-   **Error Response**: `404 Not Found` if product doesn't exist or you don't have access.

#### `PUT /api/v1/products/{id}`

Updates an existing product passport. The provided body should contain only the fields to be updated.

-   **Method**: `PUT`
-   **Body**: Partial `Product` object with fields to update.
-   **Success Response**: `200 OK`
    ```json
    {
      "id": "pp-001",
      "productName": "Updated Smart Watch Name",
      "..."
    }
    ```
-   **Error Response**: `400 Bad Request` if data is invalid, `404 Not Found` if product doesn't exist.

#### `DELETE /api/v1/products/{id}`

Deletes a product passport.

-   **Method**: `DELETE`
-   **Success Response**: `204 No Content`
-   **Error Response**: `404 Not Found` if product doesn't exist.

### Compliance

#### `POST /api/v1/compliance/check/{productId}`

Triggers an on-demand compliance check for a specific product.

-   **Method**: `POST`
-   **URL Parameters**:
    -   `productId`: The ID of the product to check.
-   **Success Response**: `200 OK`
    ```json
    {
      "productId": "pp-001",
      "status": "Verified",
      "summary": "Product is compliant with all known rules for its category."
    }
    ```

---
_This is a preliminary version of the API documentation. More endpoints will be added._

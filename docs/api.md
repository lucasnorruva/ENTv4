# Norruva REST API Documentation

The Norruva API provides programmatic access to create, manage, and verify Digital Product Passports.

## Authentication

All API requests must be authenticated using an API key. Include your key in the `Authorization` header:

`Authorization: Bearer YOUR_API_KEY`

---

## Endpoints

### Products

#### `GET /api/products`

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

#### `POST /api/products`

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

### Compliance

#### `POST /api/compliance/check/{productId}`

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

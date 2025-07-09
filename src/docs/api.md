# Norruva API Documentation

The Norruva API provides programmatic access to create, manage, and verify Digital Product Passports. We offer multiple API styles to suit different use cases, with a strong recommendation for our GraphQL API for its power and flexibility.

## Authentication

All API requests must be authenticated using an API key. Include your key in the `Authorization` header:

`Authorization: Bearer YOUR_API_KEY`

---

## Rate Limiting

Our API uses a token bucket algorithm to handle rate limiting. Different requests have different "costs" based on their complexity. For example, fetching a single item might cost 1 token, while fetching a list of items costs 5 tokens. Mutations that write data have a base cost of 10 tokens.

Your API key is associated with a tier (e.g., Free, Pro, Enterprise) which determines your bucket size and token refill rate. If you exceed your limit, you will receive a `429 Too Many Requests` error.

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

---

## Webhooks

Webhooks allow you to receive real-time notifications about events that happen on the Norruva platform, such as a product being published or a compliance check failing.

### Event Payload

All webhook events are sent as `POST` requests with a JSON body structured as follows:

```json
{
  "event": "product.published",
  "createdAt": "2024-07-30T10:00:00Z",
  "payload": {
    "id": "pp-001",
    "productName": "Eco-Friendly Smart Watch",
    "status": "Published",
    "..."
  }
}
```

### Verifying Signatures

To ensure the integrity and authenticity of webhook payloads, we sign each request with an HMAC-SHA256 signature. The signature is included in the `X-Norruva-Signature` header.

You should verify this signature on your server using your webhook's secret key (available in the developer dashboard).

#### Example: Verifying a signature in Node.js

```javascript
const crypto = require('crypto');

// This is a simplified example. In a real application, you would use a middleware
// to read the raw body of the request, as JSON parsing can alter the content.
function verifyWebhookSignature(req) {
  const secret = 'your_webhook_secret'; // Keep this secret!
  const receivedSignature = req.headers['x-norruva-signature'];
  const payload = req.rawBody; // The raw request body as a buffer or string.

  if (!receivedSignature || !payload) {
    return false;
  }

  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(computedSignature)
  );
}

// In your Express route handler:
// app.post('/webhook-handler', (req, res) => {
//   if (!verifyWebhookSignature(req)) {
//     return res.status(400).send('Invalid signature.');
//   }
//
//   // Signature is valid, process the event
//   console.log('Webhook verified successfully!');
//   res.status(200).send('Acknowledged');
// });

```

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

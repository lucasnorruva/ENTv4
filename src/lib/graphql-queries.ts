// src/lib/graphql-queries.ts

export interface SampleQuery {
  name: string;
  description: string;
  query: string;
  variables?: string;
}

export const sampleQueries: SampleQuery[] = [
  {
    name: 'Get Basic Product List',
    description: 'Fetches the first 5 products with their name and category.',
    query: `query GetProducts {
  products(limit: 5) {
    id
    productName
    category
    status
  }
}`,
    variables: '{}',
  },
  {
    name: 'Get Detailed Product',
    description: 'Fetches a single product with its detailed materials and compliance info.',
    query: `query GetDetailedProduct($id: ID!) {
  product(id: $id) {
    id
    productName
    productDescription
    category
    materials {
      name
      percentage
    }
    compliance {
      rohs {
        compliant
      }
      reach {
        svhcDeclared
      }
    }
  }
}`,
    variables: '{\n  "id": "pp-001"\n}',
  },
  {
    name: 'Create a New Product',
    description: 'A mutation to create a new product passport with basic information.',
    query: `mutation CreateNewProduct($input: ProductInput!) {
  createProduct(input: $input) {
    id
    productName
    status
    createdAt
  }
}`,
    variables: `{\n  "input": {\n    "productName": "My New API Product",\n    "productDescription": "A product created via the API explorer.",\n    "category": "Home Goods",\n    "status": "Draft",\n    "materials": [\n      {\n        "name": "Bamboo",\n        "percentage": 90\n      },\n      {\n        "name": "Plant-based resin",\n        "percentage": 10\n      }\n    ]\n  }\n}`,
  },
  {
    name: 'Get Company with Users',
    description: 'Fetches a company by its ID and lists all associated users.',
    query: `query GetCompanyAndUsers($id: ID!) {
  company(id: $id) {
    id
    name
    industry
    users {
      id
      fullName
      email
    }
  }
}`,
    variables: '{\n  "id": "comp-eco"\n}',
  },
];

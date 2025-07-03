// src/graphql/schema.ts
import { gql } from 'graphql-tag';

// We define our GraphQL schema using the GraphQL schema language.
// This will be expanded upon in future tasks.
export const typeDefs = gql`
  type Query {
    products: [Product!]
    product(id: ID!): Product
  }

  type Product {
    id: ID!
    productName: String!
    productDescription: String!
    category: String!
    supplier: String!
    status: String!
    verificationStatus: String
  }
`;

// src/graphql/schema.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    products: [Product!]
    product(id: ID!): Product
  }

  type Mutation {
    createProduct(input: ProductInput!): Product
    updateProduct(id: ID!, input: ProductInput!): Product
    deleteProduct(id: ID!): ID
  }

  # INPUTS
  input ProductInput {
    productName: String!
    productDescription: String!
    productImage: String
    category: String!
    status: String!
    gtin: String
    compliancePathId: String
    manualUrl: String
    materials: [MaterialInput!]
    manufacturing: ManufacturingInput
    certifications: [CertificationInput!]
    packaging: PackagingInput
    lifecycle: LifecycleInput
    battery: BatteryInput
    compliance: ComplianceInput
  }

  input MaterialInput {
    name: String!
    percentage: Float
    recycledContent: Float
    origin: String
  }

  input ManufacturingInput {
    facility: String!
    country: String!
    emissionsKgCo2e: Float
  }

  input CertificationInput {
    name: String!
    issuer: String!
    validUntil: String
  }

  input PackagingInput {
    type: String!
    recycledContent: Float
    recyclable: Boolean!
    weight: Float
  }

  input LifecycleInput {
    carbonFootprint: Float
    carbonFootprintMethod: String
    repairabilityScore: Float
    expectedLifespan: Int
    energyEfficiencyClass: String
    recyclingInstructions: String
  }

  input BatteryInput {
    type: String
    capacityMah: Float
    voltage: Float
    isRemovable: Boolean
  }

  input ComplianceInput {
    rohsCompliant: Boolean
    rohsExemption: String
    reachSVHC: Boolean
    scipReference: String
    prop65WarningRequired: Boolean
    ceMarked: Boolean
    foodContactSafe: Boolean
    foodContactComplianceStandard: String
  }

  # OUTPUTS
  type Product {
    id: ID!
    productName: String!
    productDescription: String!
    productImage: String
    category: String!
    supplier: String!
    status: String!
    verificationStatus: String
    lastUpdated: String!
    createdAt: String!
    gtin: String
    compliancePathId: String
    manualUrl: String
    declarationOfConformity: String

    materials: [Material!]
    manufacturing: Manufacturing
    certifications: [Certification!]
    packaging: Packaging
    lifecycle: Lifecycle
    battery: Battery
    compliance: Compliance
    sustainability: SustainabilityData
    blockchainProof: BlockchainProof
    ebsiVcId: String
  }

  type Material {
    name: String!
    percentage: Float
    recycledContent: Float
    origin: String
  }

  type Manufacturing {
    facility: String
    country: String
    emissionsKgCo2e: Float
  }

  type Certification {
    name: String!
    issuer: String!
    validUntil: String
    documentUrl: String
  }

  type Packaging {
    type: String
    recycledContent: Float
    recyclable: Boolean
    weight: Float
  }

  type Lifecycle {
    carbonFootprint: Float
    carbonFootprintMethod: String
    repairabilityScore: Float
    expectedLifespan: Int
    energyEfficiencyClass: String
    recyclingInstructions: String
  }

  type Battery {
    type: String
    capacityMah: Float
    voltage: Float
    isRemovable: Boolean
  }

  type Compliance {
    rohsCompliant: Boolean
    rohsExemption: String
    reachSVHC: Boolean
    scipReference: String
    prop65WarningRequired: Boolean
    ceMarked: Boolean
    foodContactSafe: Boolean
    foodContactComplianceStandard: String
  }

  type ComplianceGap {
    regulation: String!
    issue: String!
  }

  type SustainabilityData {
    score: Int
    environmental: Int
    social: Int
    governance: Int
    summary: String
    isCompliant: Boolean
    complianceSummary: String
    gaps: [ComplianceGap!]
  }

  type BlockchainProof {
    txHash: String!
    explorerUrl: String!
    blockHeight: Int!
  }
`;

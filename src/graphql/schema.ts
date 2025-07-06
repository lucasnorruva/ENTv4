// src/graphql/schema.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # --- INPUTS --- #

  input ProductFilterInput {
    status: String
    category: String
    supplier: String
    searchQuery: String
  }

  input ProductInput {
    productName: String!
    productDescription: String!
    productImage: String
    category: String!
    status: String!
    gtin: String
    compliancePathId: String
    manualUrl: String
    declarationOfConformity: String
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
    documentUrl: String
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
    rohs: RohsInput
    reach: ReachInput
    weee: WeeeInput
    eudr: EudrInput
    ce: CeInput
    prop65: Prop65Input
    foodContact: FoodContactInput
    battery: BatteryComplianceInput
    pfas: PfasComplianceInput
    conflictMinerals: ConflictMineralsComplianceInput
    espr: EsprInput
  }

  input RohsInput {
    compliant: Boolean
    exemption: String
  }

  input ReachInput {
    svhcDeclared: Boolean
    scipReference: String
  }

  input WeeeInput {
    registered: Boolean
    registrationNumber: String
  }

  input EudrInput {
    compliant: Boolean
    diligenceId: String
  }

  input CeInput {
    marked: Boolean
  }

  input Prop65Input {
    warningRequired: Boolean
  }

  input FoodContactInput {
    safe: Boolean
    standard: String
  }

  input BatteryComplianceInput {
    compliant: Boolean
    passportId: String
  }

  input PfasComplianceInput {
    declared: Boolean
  }

  input ConflictMineralsComplianceInput {
    compliant: Boolean
    reportUrl: String
  }

  input EsprInput {
    compliant: Boolean
    delegatedActUrl: String
  }

  input UserInput {
    fullName: String!
    email: String!
    companyId: String!
    roles: [String!]!
  }

  input CompanyInput {
    name: String!
    ownerId: String!
    industry: String
    tier: String
  }

  # --- OUTPUTS --- #

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
    verifiableCredential: String
    compliancePath: CompliancePath
    company: Company
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
    rohs: RohsCompliance
    reach: ReachCompliance
    weee: WeeeCompliance
    eudr: EudrCompliance
    ce: CeCompliance
    prop65: Prop65Compliance
    foodContact: FoodContactCompliance
    battery: BatteryCompliance
    pfas: PfasCompliance
    conflictMinerals: ConflictMineralsCompliance
    espr: EsprCompliance
  }

  type RohsCompliance {
    compliant: Boolean
    exemption: String
  }

  type ReachCompliance {
    svhcDeclared: Boolean
    scipReference: String
  }

  type WeeeCompliance {
    registered: Boolean
    registrationNumber: String
  }

  type EudrCompliance {
    compliant: Boolean
    diligenceId: String
  }

  type CeCompliance {
    marked: Boolean
  }

  type Prop65Compliance {
    warningRequired: Boolean
  }

  type FoodContactCompliance {
    safe: Boolean
    standard: String
  }

  type BatteryCompliance {
    compliant: Boolean
    passportId: String
  }

  type PfasCompliance {
    declared: Boolean
  }

  type ConflictMineralsCompliance {
    compliant: Boolean
    reportUrl: String
  }

  type EsprCompliance {
    compliant: Boolean
    delegatedActUrl: String
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
    type: String!
    txHash: String!
    explorerUrl: String!
    blockHeight: Int!
    merkleRoot: String
    proof: [String!]
  }

  type User {
    id: ID!
    fullName: String!
    email: String!
    roles: [String!]!
    companyId: ID!
    company: Company
    createdAt: String!
    updatedAt: String!
  }

  type Company {
    id: ID!
    name: String!
    ownerId: ID!
    industry: String
    tier: String
    users: [User!]
    products: [Product!]
  }

  type CompliancePath {
    id: ID!
    name: String!
    description: String!
    regulations: [String!]!
    category: String!
    rules: ComplianceRules
  }

  type ComplianceRules {
    minSustainabilityScore: Int
    requiredKeywords: [String!]
    bannedKeywords: [String!]
  }

  # The basic query operations
  type Query {
    products(limit: Int, offset: Int, filter: ProductFilterInput): [Product!]
    product(id: ID!): Product
    users(limit: Int, offset: Int): [User!]
    user(id: ID!): User
    companies(limit: Int, offset: Int): [Company!]
    company(id: ID!): Company
    compliancePaths: [CompliancePath!]
  }

  # The basic mutation operations
  type Mutation {
    createProduct(input: ProductInput!): Product
    updateProduct(id: ID!, input: ProductInput!): Product
    deleteProduct(id: ID!): ID

    createUser(input: UserInput!): User
    updateUser(id: ID!, input: UserInput!): User
    deleteUser(id: ID!): ID

    createCompany(input: CompanyInput!): Company
    updateCompany(id: ID!, input: CompanyInput!): Company
    deleteCompany(id: ID!): ID
  }
`;

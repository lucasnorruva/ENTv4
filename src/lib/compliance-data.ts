
// src/lib/compliance-data.ts
import type { CompliancePath } from "@/types";

// Omit the BaseEntity properties as they will be added by Firestore
type MockCompliancePath = Omit<
  CompliancePath,
  "id" | "createdAt" | "updatedAt"
>;

export const compliancePaths: MockCompliancePath[] = [
  {
    name: "EU Electronics Sustainability Standard (ESPR, RoHS)",
    description:
      "Requires electronics to have a sustainability score above 60, be easily repairable, and comply with RoHS substance restrictions.",
    regulations: ["ESPR", "RoHS"],
    category: "Electronics",
    rules: {
      minSustainabilityScore: 60,
      bannedKeywords: ["Lead", "Mercury", "Cadmium", "Hexavalent Chromium"],
    },
  },
  {
    name: "Global Organic Textile Standard",
    description:
      "Ensures organic status of textiles, from harvesting of raw materials, through environmentally and socially responsible manufacturing.",
    regulations: ["GOTS"],
    category: "Fashion",
    rules: {
      minSustainabilityScore: 75,
      requiredKeywords: ["Organic Cotton"],
      bannedKeywords: ["Polyester"],
    },
  },
  {
    name: "General Product Safety Regulation",
    description:
      "Baseline safety requirements for all consumer goods sold in the EU.",
    regulations: ["GPSR"],
    category: "Home Goods",
    rules: {
      minSustainabilityScore: 40,
    },
  },
];

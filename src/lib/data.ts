
import type { Product } from "@/types";

const now = new Date();

export let products: Product[] = [
  {
    id: "pp-001",
    companyId: "comp-02",
    productName: "Eco-Friendly Smart Watch Series 5",
    productDescription:
      "A stylish and sustainable smart watch with advanced health tracking features, made from recycled materials.",
    productImage: "https://placehold.co/100x100.png",
    category: "Electronics",
    supplier: "GreenTech Supplies",
    status: "Published",
    lastUpdated: new Date(new Date(now).setDate(now.getDate() - 1))
      .toISOString()
      .split("T")[0],
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 30),
    ).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
    verificationStatus: "Verified",
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 1),
    ).toISOString(),
    compliancePathId: "cp-electronics-01",
    blockchainProof: {
      txHash: "0xabc123",
      explorerUrl: "#",
      blockHeight: 50123456,
    },
    ebsiVcId: "did:ebsi:z2d5c3g7h1k9j4m6p8q",
    endOfLifeStatus: "Active",
    manualUrl: "#",
    qrLabelText:
      "Crafted with recycled aluminum and an organic cotton strap, this smart watch combines style with sustainability.",
    materials: [
      {
        name: "Recycled Aluminum",
        percentage: 60,
        recycledContent: 100,
        origin: "Germany",
      },
      {
        name: "Organic Cotton Strap",
        percentage: 15,
        recycledContent: 0,
        origin: "Turkey",
      },
    ],
    manufacturing: {
      facility: "CleanEnergy Factory",
      country: "Germany",
      emissionsKgCo2e: 5.5,
    },
    certifications: [
      { name: "EcoCert", issuer: "EcoCert Group" },
      { name: "Fair Trade Certified", issuer: "Fair Trade USA" },
    ],
    packaging: {
      type: "Recycled Cardboard",
      recycledContent: 100,
      recyclable: true,
    },
    sustainability: {
      score: 92,
      environmental: 9.5,
      social: 9.0,
      governance: 8.8,
      summary:
        "High score due to use of recycled aluminum and organic materials. Points deducted for battery disposability concerns.",
      isCompliant: true,
      complianceSummary: "Fully compliant with all applicable regulations.",
      lifecycleAnalysis: {
        carbonFootprint: {
          value: 12.5,
          unit: "kg CO2-eq",
          summary:
            "Estimated based on typical electronics manufacturing, use, and disposal. Main contributors are component production and energy use.",
        },
        lifecycleStages: {
          manufacturing:
            "Manufacturing accounts for approximately 60% of the lifecycle emissions, primarily from the production of the display and battery.",
          usePhase:
            "The use phase contributes 30% of emissions, based on an average charging frequency over a 3-year lifespan.",
          endOfLife:
            "End-of-life processing, including recycling and disposal of non-recyclable components, accounts for the remaining 10%.",
        },
        highestImpactStage: "Manufacturing",
        improvementOpportunities: [
          "Increase the percentage of recycled materials in the casing.",
          "Implement a battery take-back and replacement program.",
          "Optimize software to reduce energy consumption during use.",
        ],
      },
      classification: {
        esgCategory: "Circular Design",
        riskScore: 2,
      },
    },
  },
  {
    id: "pp-002",
    companyId: "comp-03",
    productName: "Pro-Grade 4K Drone",
    productDescription:
      "Capture stunning aerial footage with our professional-grade drone, featuring a 4K camera and 3-axis gimbal.",
    productImage: "https://placehold.co/100x100.png",
    category: "Electronics",
    supplier: "AeroDynamics Inc.",
    status: "Published",
    lastUpdated: new Date(new Date(now).setDate(now.getDate() - 3))
      .toISOString()
      .split("T")[0],
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 60),
    ).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 3)).toISOString(),
    verificationStatus: "Verified",
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 3),
    ).toISOString(),
    compliancePathId: "cp-electronics-01",
    blockchainProof: {
      txHash: "0xdef456",
      explorerUrl: "#",
      blockHeight: 50234567,
    },
    endOfLifeStatus: "Active",
    manualUrl: "#",
    materials: [
      { name: "ABS Plastic", percentage: 70 },
      { name: "Lithium-ion Battery", percentage: 20 },
      { name: "Carbon Fiber", percentage: 10 },
    ],
    manufacturing: {
      facility: "AeroDynamics Plant 1",
      country: "USA",
    },
    certifications: [{ name: "FCC", issuer: "FCC" }],
    packaging: { type: "Cardboard Box", recyclable: true },
    sustainability: {
      score: 65,
      environmental: 6.0,
      social: 7.0,
      governance: 6.8,
      summary:
        "Average score. High-performance components are difficult to recycle. Opportunities exist to improve packaging and use recycled plastics.",
      isCompliant: true,
      complianceSummary: "Fully compliant.",
      classification: {
        esgCategory: "Resource Depletion",
        riskScore: 7,
      },
    },
  },
  {
    id: "pp-003",
    companyId: "comp-02",
    productName: "Organic Cotton T-Shirt",
    productDescription:
      "A soft, comfortable, and sustainable t-shirt made from 100% organic cotton.",
    productImage: "https://placehold.co/100x100.png",
    category: "Fashion",
    supplier: "Sustainable Threads Co.",
    status: "Draft",
    lastUpdated: new Date(new Date(now).setDate(now.getDate() - 0))
      .toISOString()
      .split("T")[0],
    createdAt: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 0)).toISOString(),
    verificationStatus: "Not Submitted",
    compliancePathId: "cp-fashion-01",
    endOfLifeStatus: "Active",
    materials: [
      {
        name: "Organic Cotton",
        percentage: 100,
        recycledContent: 0,
        origin: "India",
      },
    ],
    manufacturing: {
      facility: "Sustainable Threads Mill",
      country: "India",
    },
    certifications: [{ name: "GOTS", issuer: "GOTS" }],
    packaging: { type: "Recycled Polybag", recyclable: false },
  },
  {
    id: "pp-004",
    companyId: "comp-02",
    productName: "Recycled Plastic Backpack",
    productDescription:
      "Durable and spacious backpack made entirely from recycled plastic bottles. Perfect for daily commute or travel.",
    productImage: "https://placehold.co/100x100.png",
    category: "Fashion",
    supplier: "ReNew Gear",
    status: "Archived",
    lastUpdated: new Date(new Date(now).setFullYear(now.getFullYear() - 1))
      .toISOString()
      .split("T")[0],
    createdAt: new Date(
      new Date(now).setFullYear(now.getFullYear() - 1) - 10,
    ).toISOString(),
    updatedAt: new Date(
      new Date(now).setFullYear(now.getFullYear() - 1),
    ).toISOString(),
    verificationStatus: "Failed",
    compliancePathId: "cp-fashion-01",
    lastVerificationDate: new Date(
      new Date(now).setFullYear(now.getFullYear() - 1),
    ).toISOString(),
    blockchainProof: {
      txHash: "0xghi789",
      explorerUrl: "#",
      blockHeight: 49876543,
    },
    endOfLifeStatus: "Recycled",
    materials: [
      { name: "Recycled PET", percentage: 90, recycledContent: 100 },
      { name: "Polyester", percentage: 10, recycledContent: 0 },
    ],
    manufacturing: { facility: "ReNew Factory", country: "Vietnam" },
    certifications: [],
    packaging: { type: "None", recyclable: true },
    sustainability: {
      score: 85,
      environmental: 9.0,
      social: 8.0,
      governance: 8.2,
      summary:
        "Excellent use of post-consumer recycled materials. The supply chain for the recycled PET is certified and transparent.",
      isCompliant: false,
      complianceSummary:
        "The product is non-compliant with 1 issue identified. The product contains 'Polyester' which is a banned material for the Global Organic Textile Standard.",
      gaps: [
        {
          regulation: "Global Organic Textile Standard",
          issue:
            "The product contains 'Polyester' which is a banned material for this standard.",
        },
      ],
      classification: {
        esgCategory: "Circular Design",
        riskScore: 3,
      },
    },
  },
  {
    id: "pp-005",
    companyId: "comp-03",
    productName: "Modular Shelving Unit",
    productDescription:
      "A versatile and customizable shelving unit designed to adapt to your space and needs. Made from sustainable bamboo.",
    productImage: "https://placehold.co/100x100.png",
    category: "Home Goods",
    supplier: "EcoHome Furnishings",
    status: "Published",
    lastUpdated: new Date(new Date(now).setDate(now.getDate() - 15))
      .toISOString()
      .split("T")[0],
    createdAt: new Date(
      new Date(now).setDate(now.getDate() - 45),
    ).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 15)).toISOString(),
    verificationStatus: "Verified",
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 45),
    ).toISOString(),
    compliancePathId: "cp-homegoods-01",
    endOfLifeStatus: "Active",
    manualUrl: "#",
    materials: [{ name: "Bamboo", percentage: 100, origin: "China" }],
    manufacturing: { facility: "EcoHome Workshop", country: "China" },
    certifications: [{ name: "FSC Certified", issuer: "FSC" }],
    packaging: { type: "Cardboard", recyclable: true, recycledContent: 50 },
    sustainability: {
      score: 88,
      environmental: 9.2,
      social: 8.5,
      governance: 8.6,
      summary:
        "Bamboo is a highly renewable resource. The modular design promotes repairability and long-term use, reducing waste.",
      isCompliant: true,
      complianceSummary: "Fully compliant.",
      classification: {
        esgCategory: "Sustainable Sourcing",
        riskScore: 2,
      },
    },
  },
];

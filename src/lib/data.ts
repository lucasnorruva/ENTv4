import type { Product } from "@/types";

const now = new Date();

export let products: Product[] = [
  {
    id: "pp-001",
    productName: "Eco-Friendly Smart Watch Series 5",
    productDescription:
      "A stylish and sustainable smart watch with advanced health tracking features, made from recycled materials.",
    productImage: "https://placehold.co/100x100.png",
    category: "Electronics",
    supplier: "GreenTech Supplies",
    complianceLevel: "High",
    classification: {
      esgCategory: "Circular Design",
      riskScore: 2,
    },
    qrLabelText:
      "Crafted with recycled aluminum and an organic cotton strap, this smart watch combines style with sustainability.",
    esg: {
      score: 92,
      environmental: 9.5,
      social: 9.0,
      governance: 8.8,
      summary:
        "High score due to use of recycled aluminum and organic materials. Points deducted for battery disposability concerns.",
    },
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
    currentInformation: JSON.stringify(
      {
        materials: ["Recycled Aluminum", "Organic Cotton Strap"],
        certifications: ["EcoCert", "Fair Trade"],
        battery_life_hours: 72,
        water_resistance_atm: 5,
        manufacturing: {
          facility: "ISO 14001 certified",
          country: "Germany",
        },
      },
      null,
      2,
    ),
    status: "Published",
    lastUpdated: new Date(new Date(now).setDate(now.getDate() - 1))
      .toISOString()
      .split("T")[0],
    createdAt: new Date(new Date(now).setDate(now.getDate() - 30)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
    verificationStatus: "Verified",
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 1),
    ).toISOString(),
    blockchainProof: {
      txHash: "0xabc123",
      explorerUrl: "#",
      blockHeight: 50123456,
    },
    ebsiVcId: "did:ebsi:z2d5c3g7h1k9j4m6p8q",
    endOfLifeStatus: "Active",
  },
  {
    id: "pp-002",
    productName: "Pro-Grade 4K Drone",
    productDescription:
      "Capture stunning aerial footage with our professional-grade drone, featuring a 4K camera and 3-axis gimbal.",
    productImage: "https://placehold.co/100x100.png",
    category: "Electronics",
    supplier: "AeroDynamics Inc.",
    complianceLevel: "Medium",
    classification: {
      esgCategory: "Resource Depletion",
      riskScore: 7,
    },
    qrLabelText:
      "Engineered for performance, this 4K drone offers professional-grade features for creators and enthusiasts.",
    esg: {
      score: 65,
      environmental: 6.0,
      social: 7.0,
      governance: 6.8,
      summary:
        "Average score. High-performance components are difficult to recycle. Opportunities exist to improve packaging and use recycled plastics.",
    },
    currentInformation: JSON.stringify(
      {
        camera_resolution: "4K",
        flight_time_minutes: 30,
        range_km: 5,
        weight_grams: 795,
        materials: ["Plastic", "Lithium"],
      },
      null,
      2,
    ),
    status: "Published",
    lastUpdated: new Date(new Date(now).setDate(now.getDate() - 3))
      .toISOString()
      .split("T")[0],
    createdAt: new Date(new Date(now).setDate(now.getDate() - 60)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 3)).toISOString(),
    verificationStatus: "Verified",
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 3),
    ).toISOString(),
    blockchainProof: {
      txHash: "0xdef456",
      explorerUrl: "#",
      blockHeight: 50234567,
    },
    endOfLifeStatus: "Active",
  },
  {
    id: "pp-003",
    productName: "Organic Cotton T-Shirt",
    productDescription:
      "A soft, comfortable, and sustainable t-shirt made from 100% organic cotton.",
    productImage: "https://placehold.co/100x100.png",
    category: "Fashion",
    supplier: "Sustainable Threads Co.",
    complianceLevel: "High",
    classification: {
      esgCategory: "Pollution Prevention",
      riskScore: 1,
    },
    qrLabelText:
      "Experience pure comfort with our classic t-shirt, ethically crafted from 100% GOTS-certified organic cotton.",
    currentInformation: JSON.stringify(
      {
        material: "100% Organic Cotton",
        origin: "India",
        color: "White",
      },
      null,
      2,
    ),
    status: "Draft",
    lastUpdated: new Date(new Date(now).setDate(now.getDate() - 0))
      .toISOString()
      .split("T")[0],
    createdAt: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 0)).toISOString(),
    endOfLifeStatus: "Active",
  },
  {
    id: "pp-004",
    productName: "Recycled Plastic Backpack",
    productDescription:
      "Durable and spacious backpack made entirely from recycled plastic bottles. Perfect for daily commute or travel.",
    productImage: "https://placehold.co/100x100.png",
    category: "Fashion",
    supplier: "ReNew Gear",
    complianceLevel: "Medium",
    classification: {
      esgCategory: "Circular Design",
      riskScore: 3,
    },
    qrLabelText:
      "Carry your essentials in a backpack that makes a difference, constructed from 100% recycled PET bottles.",
    esg: {
      score: 85,
      environmental: 9.0,
      social: 8.0,
      governance: 8.2,
      summary:
        "Excellent use of post-consumer recycled materials. The supply chain for the recycled PET is certified and transparent.",
    },
    currentInformation: JSON.stringify(
      {
        capacity_liters: 25,
        materials: ["Recycled PET", "Polyester"],
        features: ["Laptop Compartment", "Water Resistant"],
      },
      null,
      2,
    ),
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
    complianceSummary:
      "The product is non-compliant with 1 issue identified. The product contains 'Polyester' which is a banned material for the Global Organic Textile Standard.",
    complianceGaps: [
      {
        regulation: "Global Organic Textile Standard",
        issue:
          "The product contains 'Polyester' which is a banned material for this standard.",
      },
    ],
    lastVerificationDate: new Date(
      new Date(now).setFullYear(now.getFullYear() - 1),
    ).toISOString(),
    blockchainProof: {
      txHash: "0xghi789",
      explorerUrl: "#",
      blockHeight: 49876543,
    },
    endOfLifeStatus: "Recycled",
  },
  {
    id: "pp-005",
    productName: "Modular Shelving Unit",
    productDescription:
      "A versatile and customizable shelving unit designed to adapt to your space and needs. Made from sustainable bamboo.",
    productImage: "https://placehold.co/100x100.png",
    category: "Home Goods",
    supplier: "EcoHome Furnishings",
    complianceLevel: "High",
    classification: {
      esgCategory: "Sustainable Sourcing",
      riskScore: 2,
    },
    qrLabelText:
      "Organize your space with this stylish and durable shelving unit, built from 100% sustainably sourced bamboo.",
    esg: {
      score: 88,
      environmental: 9.2,
      social: 8.5,
      governance: 8.6,
      summary:
        "Bamboo is a highly renewable resource. The modular design promotes repairability and long-term use, reducing waste.",
    },
    currentInformation: JSON.stringify(
      {
        material: "Bamboo",
        dimensions_cm: { width: 80, height: 180, depth: 30 },
        assembly_required: true,
      },
      null,
      2,
    ),
    status: "Published",
    lastUpdated: new Date(new Date(now).setDate(now.getDate() - 15))
      .toISOString()
      .split("T")[0],
    createdAt: new Date(new Date(now).setDate(now.getDate() - 45)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 15)).toISOString(),
    verificationStatus: "Verified",
    lastVerificationDate: new Date(
      new Date(now).setDate(now.getDate() - 45),
    ).toISOString(),
    endOfLifeStatus: "Active",
  },
];

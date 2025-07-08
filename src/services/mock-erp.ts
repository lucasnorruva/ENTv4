// src/services/mock-erp.ts
'use server';

/**
 * This file mocks a connection to an external Enterprise Resource Planning (ERP) system.
 * In a real-world scenario, this would involve API clients, data transformation layers,
 * and robust error handling to connect to systems like SAP, Oracle, etc.
 */

export interface ErpProduct {
  sku: string;
  gtin: string;
  name: string;
  description: string;
  category: 'Electronics' | 'Fashion' | 'Home Goods';
  manufacturing_plant: string;
  country_of_origin: string;
  bill_of_materials: {
    material_name: string;
    percentage: number;
  }[];
}

const mockErpData: Record<string, ErpProduct[]> = {
  'SAP S/4HANA': [
    {
      sku: 'SAP-SMW-01',
      gtin: '09501101530010',
      name: 'SAP Integrated Smart Watch',
      description: 'A smart watch with direct integration to SAP logistics.',
      category: 'Electronics',
      manufacturing_plant: 'Heidelberg Plant',
      country_of_origin: 'Germany',
      bill_of_materials: [
        { material_name: 'Sapphire Glass', percentage: 20 },
        { material_name: 'Titanium Case', percentage: 50 },
        { material_name: 'Leather Strap', percentage: 30 },
      ],
    },
    {
      sku: 'SAP-DRN-01',
      gtin: '09501101530027',
      name: 'Logistics Drone (SAP Edition)',
      description: 'A drone for warehouse stock management, synced with SAP.',
      category: 'Electronics',
      manufacturing_plant: 'Walldorf Drone Facility',
      country_of_origin: 'Germany',
      bill_of_materials: [
        { material_name: 'Carbon Fiber', percentage: 70 },
        { material_name: 'ABS Plastic', percentage: 30 },
      ],
    },
  ],
  'Oracle NetSuite': [
    {
      sku: 'ORA-TS-01',
      gtin: '09501101530034',
      name: 'NetSuite Organic T-Shirt',
      description: 'A 100% organic cotton t-shirt tracked via NetSuite SCM.',
      category: 'Fashion',
      manufacturing_plant: 'Oracle Eco-Textiles',
      country_of_origin: 'USA',
      bill_of_materials: [
        { material_name: 'Organic Cotton', percentage: 100 },
      ],
    },
  ],
  'Microsoft Dynamics 365': [
      {
        sku: 'DYN-CH-01',
        gtin: '09501101530041',
        name: 'Dynamics Connected Office Chair',
        description: 'An ergonomic office chair with supply chain data managed in Dynamics 365.',
        category: 'Home Goods',
        manufacturing_plant: 'Redmond Seating Co.',
        country_of_origin: 'USA',
        bill_of_materials: [
          { material_name: 'Recycled Aluminum Base', percentage: 40 },
          { material_name: 'Mesh Fabric', percentage: 30 },
          { material_name: 'Foam Cushion', percentage: 30 },
        ],
      },
  ]
};

/**
 * Fetches product data from a mocked ERP system.
 * @param erpSystemName The name of the ERP system to "connect" to.
 * @returns A promise that resolves to an array of ERP product data.
 */
export async function fetchProductsFromERP(
  erpSystemName: string,
): Promise<ErpProduct[]> {
  console.log(`Simulating API call to fetch products from ${erpSystemName}...`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const data = mockErpData[erpSystemName];

  if (!data) {
    console.warn(`No mock data found for ERP system: ${erpSystemName}`);
    return [];
  }

  console.log(`Successfully fetched ${data.length} products from ${erpSystemName}.`);
  return data;
}

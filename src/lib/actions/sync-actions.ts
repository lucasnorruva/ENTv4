// src/lib/actions/sync-actions.ts
'use server';

import { getUserById } from '../auth';
import { checkPermission } from '../permissions';
import { getProductByGtin, saveProduct } from './product-actions';
import { logAuditEvent } from './audit-actions';
import { fetchProductsFromERP, type ErpProduct } from '@/services/mock-erp';
import type { ProductFormValues } from '../schemas';

function mapErpToDpp(erpProduct: ErpProduct): ProductFormValues {
  return {
    productName: erpProduct.name,
    productDescription: erpProduct.description,
    gtin: erpProduct.gtin,
    category: erpProduct.category,
    status: 'Draft',
    materials: erpProduct.bill_of_materials.map(m => ({
      name: m.material_name,
      percentage: m.percentage,
    })),
    manufacturing: {
      facility: erpProduct.manufacturing_plant,
      country: erpProduct.country_of_origin,
    },
  };
}

export async function syncWithErp(
  erpSystemName: string,
  userId: string,
): Promise<{ createdCount: number; updatedCount: number }> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  checkPermission(user, 'integration:sync');

  await logAuditEvent(
    'integration.sync.started',
    erpSystemName,
    {},
    userId,
  );

  console.log(`Starting sync with ${erpSystemName}...`);
  const erpProducts = await fetchProductsFromERP(erpSystemName);
  console.log(`Fetched ${erpProducts.length} products from ERP.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const erpProduct of erpProducts) {
    const dppData = mapErpToDpp(erpProduct);

    // Check if a product with this GTIN already exists
    const existingProduct = erpProduct.gtin
      ? await getProductByGtin(erpProduct.gtin, userId)
      : null;

    if (existingProduct) {
      console.log(`Updating existing product: ${existingProduct.productName}`);
      await saveProduct(dppData, userId, existingProduct.id);
      updatedCount++;
    } else {
      console.log(`Creating new product: ${dppData.productName}`);
      await saveProduct(dppData, userId);
      createdCount++;
    }
  }

  const result = { createdCount, updatedCount };
  await logAuditEvent('integration.sync.completed', erpSystemName, result, userId);

  console.log(`Sync with ${erpSystemName} complete.`);
  return result;
}

// src/lib/actions/report-actions.ts
'use server';

import { products as mockProducts } from '../data';
import { auditLogs as mockAuditLogs } from '../audit-log-data';
import { users as mockUsers } from '../user-data';
import Papa from 'papaparse';

const flattenObject = (
  obj: any,
  parentKey = '',
  res: Record<string, any> = {},
) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = parentKey ? `${parentKey}_${key}` : key;
      const value = obj[key];
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        flattenObject(value, propName, res);
      } else if (Array.isArray(value)) {
        res[propName] = JSON.stringify(value);
      } else {
        res[propName] = value;
      }
    }
  }
  return res;
};

export async function exportProducts(
  format: 'csv' | 'json',
  dateRange?: { from: Date; to: Date },
): Promise<string> {
  let products = mockProducts;

  if (dateRange?.from && dateRange?.to) {
    products = products.filter(p => {
      const productDate = new Date(p.updatedAt);
      return productDate >= dateRange.from! && productDate <= dateRange.to!;
    });
  }

  if (products.length === 0) {
    return '';
  }

  if (format === 'json') {
    return JSON.stringify(products, null, 2);
  }

  // Flatten for CSV
  const flatProducts = products.map(flattenObject);
  
  // Unparse to CSV using papaparse
  return Papa.unparse(flatProducts);
}

export async function exportComplianceReport(
  format: 'csv',
  dateRange?: { from: Date; to: Date },
): Promise<string> {
  let products = mockProducts;
  if (format !== 'csv') {
    throw new Error('Unsupported format for compliance report.');
  }

  if (dateRange?.from && dateRange?.to) {
    products = products.filter(p => {
      const productDate = new Date(p.updatedAt);
      return productDate >= dateRange.from! && productDate <= dateRange.to!;
    });
  }

  if (products.length === 0) {
    return '';
  }

  const complianceData = products.map(p => ({
    productId: p.id,
    productName: p.productName,
    supplier: p.supplier,
    verificationStatus: p.verificationStatus,
    isCompliant: p.sustainability?.isCompliant,
    complianceSummary: p.sustainability?.complianceSummary,
    gaps: p.sustainability?.gaps
      ? JSON.stringify(p.sustainability.gaps)
      : '[]',
    lastUpdated: p.updatedAt,
  }));
  
  return Papa.unparse(complianceData);
}

export async function exportFullAuditTrail(dateRange?: {
  from: Date;
  to: Date;
}): Promise<string> {
  let logs = mockAuditLogs;

  if (dateRange?.from && dateRange?.to) {
    logs = logs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= dateRange.from! && logDate <= dateRange.to!;
    });
  }

  if (logs.length === 0) {
    return '';
  }

  const allUsers = mockUsers;
  const allProducts = mockProducts;
  const userMap = new Map(allUsers.map(u => [u.id, u.email]));
  const productMap = new Map(allProducts.map(p => [p.id, p.productName]));

  const auditData = logs.map(log => ({
    logId: log.id,
    timestamp: log.createdAt,
    action: log.action,
    userEmail: userMap.get(log.userId) || log.userId,
    entityType: log.entityId.split('-')[0] || 'System',
    entityId: log.entityId,
    entityName: productMap.get(log.entityId) || 'N/A',
    details: JSON.stringify(log.details),
  }));

  return Papa.unparse(auditData);
}

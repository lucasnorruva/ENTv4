// src/lib/audit-log-data.ts
import type { AuditLog } from "@/types";

const now = new Date();

export const auditLogs: AuditLog[] = [
  {
    id: "log-001",
    userId: "user-supplier",
    action: "product.created",
    entityId: "pp-003",
    details: { productName: "Organic Cotton T-Shirt" },
    createdAt: new Date(new Date(now).setHours(now.getHours() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setHours(now.getHours() - 1)).toISOString(),
  },
  {
    id: "log-002",
    userId: "user-supplier",
    action: "passport.submitted",
    entityId: "pp-001",
    details: { status: "Pending" },
    createdAt: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
  },
  {
    id: "log-003",
    userId: "user-supplier",
    action: "product.updated",
    entityId: "pp-002",
    details: { fields: ["productDescription"] },
    createdAt: new Date(new Date(now).setDate(now.getDate() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 2)).toISOString(),
  },
  {
    id: "log-004",
    userId: "user-supplier",
    action: "product.created",
    entityId: "pp-005",
    details: { productName: "Modular Shelving Unit" },
    createdAt: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 5)).toISOString(),
  },
];

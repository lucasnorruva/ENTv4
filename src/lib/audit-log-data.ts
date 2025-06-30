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
    createdAt: new Date(
      new Date(now).setHours(now.getHours() - 1),
    ).toISOString(),
    updatedAt: new Date(
      new Date(now).setHours(now.getHours() - 1),
    ).toISOString(),
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
    id: "log-005",
    userId: "user-auditor",
    action: "passport.approved",
    entityId: "pp-001",
    details: { txHash: "0xabc123" },
    createdAt: new Date(new Date(now).setDate(now.getDate() - 2)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 2)).toISOString(),
  },
  {
    id: "log-003",
    userId: "user-supplier",
    action: "product.updated",
    entityId: "pp-002",
    details: { fields: ["productDescription"] },
    createdAt: new Date(new Date(now).setDate(now.getDate() - 3)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 3)).toISOString(),
  },
  {
    id: "log-008",
    userId: "user-compliance",
    action: "compliance.resolved",
    entityId: "pp-004",
    details: { newStatus: "Draft" },
    createdAt: new Date(new Date(now).setDate(now.getDate() - 4)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 4)).toISOString(),
  },
  {
    id: "log-006",
    userId: "user-auditor",
    action: "passport.rejected",
    entityId: "pp-004",
    details: { reason: "Contains banned material 'Polyester'" },
    createdAt: new Date(
      new Date(now).setFullYear(now.getFullYear() - 1),
    ).toISOString(),
    updatedAt: new Date(
      new Date(now).setFullYear(now.getFullYear() - 1),
    ).toISOString(),
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
  {
    id: "log-007",
    userId: "user-recycler",
    action: "product.recycled",
    entityId: "pp-004",
    details: {},
    createdAt: new Date(new Date(now).setMonth(now.getMonth() - 6)).toISOString(),
    updatedAt: new Date(new Date(now).setMonth(now.getMonth() - 6)).toISOString(),
  },
];

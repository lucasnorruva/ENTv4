// src/lib/api-key-data.ts
import type { ApiKey } from "@/types";

const now = new Date();

export let apiKeys: ApiKey[] = [
  {
    id: "key-001",
    label: "My Production Server",
    token: "nor_prod_******************1234",
    status: "Active",
    userId: "user-developer",
    createdAt: new Date(new Date(now).setDate(now.getDate() - 10)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 10)).toISOString(),
    lastUsed: new Date(new Date(now).setDate(now.getDate() - 1)).toISOString(),
  },
  {
    id: "key-002",
    label: "Old Integration (Revoked)",
    token: "nor_rev_******************5678",
    status: "Revoked",
    userId: "user-developer",
    createdAt: new Date(new Date(now).setDate(now.getDate() - 90)).toISOString(),
    updatedAt: new Date(new Date(now).setDate(now.getDate() - 30)).toISOString(),
  },
];

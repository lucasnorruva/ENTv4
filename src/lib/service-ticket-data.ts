// src/lib/service-ticket-data.ts
import type { ServiceTicket } from "@/types";

const now = new Date();

export let serviceTickets: ServiceTicket[] = [
  {
    id: "tkt-001",
    productId: "pp-001",
    customerName: "Alice Johnson",
    issue: "Device not holding a charge for more than 4 hours.",
    status: "Open",
    createdAt: new Date(now.setDate(now.getDate() - 1)).toISOString(),
    updatedAt: new Date(now.setDate(now.getDate() - 1)).toISOString(),
  },
  {
    id: "tkt-002",
    productId: "pp-002",
    customerName: "Bob Williams",
    issue: "One of the propellers is cracked after a minor crash.",
    status: "In Progress",
    createdAt: new Date(now.setDate(now.getDate() - 3)).toISOString(),
    updatedAt: new Date(now.setDate(now.getDate() - 2)).toISOString(),
  },
  {
    id: "tkt-003",
    productId: "pp-001",
    customerName: "Charlie Brown",
    issue: "Screen is flickering intermittently.",
    status: "Closed",
    createdAt: new Date(now.setDate(now.getDate() - 10)).toISOString(),
    updatedAt: new Date(now.setDate(now.getDate() - 5)).toISOString(),
  },
  {
    id: "tkt-004",
    productId: "pp-005",
    customerName: "Diana Prince",
    issue: "Missing one of the shelf pegs from the original packaging.",
    status: "Closed",
    createdAt: new Date(now.setDate(now.getDate() - 20)).toISOString(),
    updatedAt: new Date(now.setDate(now.getDate() - 18)).toISOString(),
  },
];

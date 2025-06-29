// src/lib/auth.ts
import type { User, Role } from "@/types";
import { UserRoles } from "./constants";

const mockUsers: Record<Role, User> = {
  [UserRoles.ADMIN]: {
    id: "user-admin",
    fullName: "Admin User",
    email: "admin@norruva.com",
    companyId: "comp-01",
    roles: [UserRoles.ADMIN],
    createdAt: "",
    updatedAt: "",
  },
  [UserRoles.SUPPLIER]: {
    id: "user-supplier",
    fullName: "Supplier User",
    email: "supplier@norruva.com",
    companyId: "comp-02",
    roles: [UserRoles.SUPPLIER],
    createdAt: "",
    updatedAt: "",
  },
  [UserRoles.AUDITOR]: {
    id: "user-auditor",
    fullName: "Auditor User",
    email: "auditor@norruva.com",
    companyId: "comp-01",
    roles: [UserRoles.AUDITOR],
    createdAt: "",
    updatedAt: "",
  },
  [UserRoles.COMPLIANCE_MANAGER]: {
    id: "user-compliance",
    fullName: "Compliance Manager",
    email: "compliance@norruva.com",
    companyId: "comp-01",
    roles: [UserRoles.COMPLIANCE_MANAGER],
    createdAt: "",
    updatedAt: "",
  },
  [UserRoles.MANUFACTURER]: {
    id: "user-manufacturer",
    fullName: "Manufacturer User",
    email: "manufacturer@norruva.com",
    companyId: "comp-03",
    roles: [UserRoles.MANUFACTURER],
    createdAt: "",
    updatedAt: "",
  },
  [UserRoles.SERVICE_PROVIDER]: {
    id: "user-service",
    fullName: "Service Provider",
    email: "service@norruva.com",
    companyId: "comp-04",
    roles: [UserRoles.SERVICE_PROVIDER],
    createdAt: "",
    updatedAt: "",
  },
  [UserRoles.RECYCLER]: {
    id: "user-recycler",
    fullName: "Recycler User",
    email: "recycler@norruva.com",
    companyId: "comp-05",
    roles: [UserRoles.RECYCLER],
    createdAt: "",
    updatedAt: "",
  },
  [UserRoles.DEVELOPER]: {
    id: "user-developer",
    fullName: "Developer User",
    email: "developer@norruva.com",
    companyId: "comp-01",
    roles: [UserRoles.DEVELOPER],
    createdAt: "",
    updatedAt: "",
  },
  [UserRoles.BUSINESS_ANALYST]: {
    id: "user-analyst",
    fullName: "Business Analyst",
    email: "analyst@norruva.com",
    companyId: "comp-01",
    roles: [UserRoles.BUSINESS_ANALYST],
    createdAt: "",
    updatedAt: "",
  },
};

/**
 * Mocks fetching the current user based on a role.
 * In a real application, this would involve validating a session token
 * and fetching user data from Firestore.
 * @param role The role to simulate being logged in as.
 * @returns A mock user object.
 */
export async function getCurrentUser(role: Role): Promise<User> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockUsers[role] || mockUsers[UserRoles.SUPPLIER];
}

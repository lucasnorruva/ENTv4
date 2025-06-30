
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
    createdAt: "2024-07-01T10:00:00Z",
    updatedAt: "2024-07-20T10:00:00Z",
  },
  [UserRoles.SUPPLIER]: {
    id: "user-supplier",
    fullName: "Supplier User",
    email: "supplier@norruva.com",
    companyId: "comp-02",
    roles: [UserRoles.SUPPLIER],
    createdAt: "2024-07-02T11:00:00Z",
    updatedAt: "2024-07-19T11:00:00Z",
  },
  [UserRoles.AUDITOR]: {
    id: "user-auditor",
    fullName: "Auditor User",
    email: "auditor@norruva.com",
    companyId: "comp-01",
    roles: [UserRoles.AUDITOR],
    createdAt: "2024-07-03T12:00:00Z",
    updatedAt: "2024-07-18T12:00:00Z",
  },
  [UserRoles.COMPLIANCE_MANAGER]: {
    id: "user-compliance",
    fullName: "Compliance Manager",
    email: "compliance@norruva.com",
    companyId: "comp-01",
    roles: [UserRoles.COMPLIANCE_MANAGER],
    createdAt: "2024-07-04T13:00:00Z",
    updatedAt: "2024-07-17T13:00:00Z",
  },
  [UserRoles.MANUFACTURER]: {
    id: "user-manufacturer",
    fullName: "Manufacturer User",
    email: "manufacturer@norruva.com",
    companyId: "comp-03",
    roles: [UserRoles.MANUFACTURER],
    createdAt: "2024-07-05T14:00:00Z",
    updatedAt: "2024-07-16T14:00:00Z",
  },
  [UserRoles.SERVICE_PROVIDER]: {
    id: "user-service",
    fullName: "Service Provider",
    email: "service@norruva.com",
    companyId: "comp-04",
    roles: [UserRoles.SERVICE_PROVIDER],
    createdAt: "2024-07-06T15:00:00Z",
    updatedAt: "2024-07-15T15:00:00Z",
  },
  [UserRoles.RECYCLER]: {
    id: "user-recycler",
    fullName: "Recycler User",
    email: "recycler@norruva.com",
    companyId: "comp-05",
    roles: [UserRoles.RECYCLER],
    createdAt: "2024-07-07T16:00:00Z",
    updatedAt: "2024-07-14T16:00:00Z",
  },
  [UserRoles.DEVELOPER]: {
    id: "user-developer",
    fullName: "Developer User",
    email: "developer@norruva.com",
    companyId: "comp-01",
    roles: [UserRoles.DEVELOPER],
    createdAt: "2024-07-08T17:00:00Z",
    updatedAt: "2024-07-13T17:00:00Z",
  },
  [UserRoles.BUSINESS_ANALYST]: {
    id: "user-analyst",
    fullName: "Business Analyst",
    email: "analyst@norruva.com",
    companyId: "comp-01",
    roles: [UserRoles.BUSINESS_ANALYST],
    createdAt: "2024-07-09T18:00:00Z",
    updatedAt: "2024-07-12T18:00:00Z",
  },
};

/**
 * Mocks fetching all users in the system.
 * @returns A promise that resolves to an array of all mock users.
 */
export async function getMockUsers(): Promise<User[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 50));
  return Object.values(mockUsers);
}

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

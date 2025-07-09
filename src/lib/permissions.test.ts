
// src/lib/permissions.test.ts
import { can } from './permissions';
import { UserRoles, type Role } from './constants';
import type { User, Product } from '@/types';

// Helper function to create a mock user
const createMockUser = (id: string, roles: Role[], companyId: string = 'comp-1'): User => ({
  id,
  fullName: `${roles[0]} User`,
  email: `${id}@test.com`,
  roles,
  companyId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  onboardingComplete: true,
  isMfaEnabled: false,
});

// Helper function to create a mock product
const createMockProduct = (id: string, companyId: string, status: Product['status'] = 'Draft'): Product => ({
  id,
  productName: `Product ${id}`,
  productDescription: 'A test product',
  productImage: '',
  category: 'Electronics',
  supplier: 'Test Supplier',
  companyId,
  status,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  materials: [],
  endOfLifeStatus: 'Active',
});


describe('Permission System (can function)', () => {
    // Define mock users for various roles
    const admin = createMockUser('admin-1', [UserRoles.ADMIN], 'comp-norruva');
    const supplier1 = createMockUser('supplier-1', [UserRoles.SUPPLIER], 'comp-1');
    const supplier2 = createMockUser('supplier-2', [UserRoles.SUPPLIER], 'comp-2');
    const auditor = createMockUser('auditor-1', [UserRoles.AUDITOR], 'comp-norruva');
    const complianceManager = createMockUser('compliance-1', [UserRoles.COMPLIANCE_MANAGER], 'comp-norruva');
    const recycler = createMockUser('recycler-1', [UserRoles.RECYCLER], 'comp-norruva');
    const serviceProvider = createMockUser('service-1', [UserRoles.SERVICE_PROVIDER], 'comp-norruva');
    const developer = createMockUser('dev-1', [UserRoles.DEVELOPER], 'comp-1');


    // Define mock resources
    const product1 = createMockProduct('prod-1', 'comp-1');
    const product2 = createMockProduct('prod-2', 'comp-2');
    const publishedProduct = createMockProduct('prod-3', 'comp-1', 'Published');


    // Admin Permissions
    describe('Admin Role', () => {
        it('should allow admin to perform any action', () => {
            expect(can(admin, 'product:create')).toBe(true);
            expect(can(admin, 'product:edit', product1)).toBe(true);
            expect(can(admin, 'product:delete', product1)).toBe(true);
            expect(can(admin, 'product:approve')).toBe(true);
            expect(can(admin, 'user:manage')).toBe(true);
            expect(can(admin, 'admin:manage_settings')).toBe(true);
        });
    });

    // Product Permissions
    describe('Product Actions', () => {
        it('should allow a supplier to create a product', () => {
            expect(can(supplier1, 'product:create')).toBe(true);
        });

        it('should not allow a non-supplier to create a product', () => {
            expect(can(auditor, 'product:create')).toBe(false);
        });

        it('should allow a supplier to edit their own product', () => {
            expect(can(supplier1, 'product:edit', product1)).toBe(true);
        });

        it('should not allow a supplier to edit a product from another company', () => {
            expect(can(supplier1, 'product:edit', product2)).toBe(false);
        });

        it('should allow a supplier to delete their own draft product', () => {
            expect(can(supplier1, 'product:delete', product1)).toBe(true);
        });

        it('should not allow a supplier to delete a published product', () => {
            expect(can(supplier1, 'product:delete', publishedProduct)).toBe(false);
        });
    });

    // Auditing & Compliance Permissions
    describe('Auditing and Compliance Actions', () => {
        it('should allow an auditor to approve a product', () => {
            expect(can(auditor, 'product:approve')).toBe(true);
        });

        it('should allow an auditor to reject a product', () => {
            expect(can(auditor, 'product:reject')).toBe(true);
        });

        it('should not allow a supplier to approve a product', () => {
            expect(can(supplier1, 'product:approve')).toBe(false);
        });

        it('should allow a compliance manager to resolve an issue', () => {
            expect(can(complianceManager, 'product:resolve')).toBe(true);
        });
    });
    
    // Lifecycle Permissions
    describe('Lifecycle Actions', () => {
        it('should allow a recycler to mark a product as recycled', () => {
            expect(can(recycler, 'product:recycle', product1)).toBe(true);
        });

        it('should allow a service provider to add a service record', () => {
            expect(can(serviceProvider, 'product:add_service_record')).toBe(true);
        });
    });

    // User Management Permissions
    describe('User Management', () => {
        it('should allow a user to edit their own profile', () => {
            expect(can(supplier1, 'user:edit', supplier1)).toBe(true);
        });

        it('should not allow a user to edit another user\'s profile', () => {
            expect(can(supplier1, 'user:edit', supplier2)).toBe(false);
        });

        it('should not allow a non-admin to manage users', () => {
            expect(can(supplier1, 'user:manage')).toBe(false);
        });
    });

    describe('Developer Permissions', () => {
        it('should allow a developer to generate tests', () => {
            expect(can(developer, 'developer:generate_tests')).toBe(true);
        });
    
        it('should not allow a non-developer to generate tests', () => {
            expect(can(supplier1, 'developer:generate_tests')).toBe(false);
        });
    });
});

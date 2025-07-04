// src/services/compliance.test.ts
import { verifyProductAgainstPath } from './compliance';
import type { Product, CompliancePath } from '@/types';

// Helper to create a mock product
const createMockProduct = (
  sustainabilityScore?: number,
  materials?: { name: string }[],
  compliance?: Product['compliance'],
): Product => ({
  id: 'test-prod',
  productName: 'Test Product',
  companyId: 'comp-1',
  productDescription: 'desc',
  productImage: '',
  category: 'Electronics',
  supplier: 'Test Supplier',
  status: 'Published',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  materials: materials || [],
  endOfLifeStatus: 'Active',
  sustainability: {
    score: sustainabilityScore || 50,
    environmental: 50,
    social: 50,
    governance: 50,
    isCompliant: true,
    summary: '',
    complianceSummary: '',
  },
  compliance: compliance || {},
});

// Helper to create a mock compliance path
const createMockPath = (
  id: string,
  rules: CompliancePath['rules'],
  regulations: string[] = ['TestReg'],
): CompliancePath => ({
  id,
  name: `Path ${id}`,
  description: 'A test path',
  category: 'Electronics',
  regulations,
  rules,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('Compliance Verification Service', () => {
  it('should return compliant if all rules pass', async () => {
    const product = createMockProduct(80, [{ name: 'Recycled Plastic' }], { rohsCompliant: true });
    const path = createMockPath('p1', { minSustainabilityScore: 70, requiredKeywords: ['Plastic'] }, ['RoHS']);
    const { isCompliant, gaps } = await verifyProductAgainstPath(product, path);
    expect(isCompliant).toBe(true);
    expect(gaps).toHaveLength(0);
  });

  it('should fail if sustainability score is too low', async () => {
    const product = createMockProduct(50);
    const path = createMockPath('p2', { minSustainabilityScore: 60 });
    const { isCompliant, gaps } = await verifyProductAgainstPath(product, path);
    expect(isCompliant).toBe(false);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].issue).toContain('score of 50 is below the required minimum of 60');
  });

  it('should fail if a banned keyword is present', async () => {
    const product = createMockProduct(90, [{ name: 'Contains Lead' }]);
    const path = createMockPath('p3', { bannedKeywords: ['Lead'] });
    const { isCompliant, gaps } = await verifyProductAgainstPath(product, path);
    expect(isCompliant).toBe(false);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].issue).toContain("banned material: 'Contains Lead'");
  });

  it('should fail if a required keyword is missing', async () => {
    const product = createMockProduct(90, [{ name: 'Aluminum' }]);
    const path = createMockPath('p4', { requiredKeywords: ['Organic Cotton'] });
    const { isCompliant, gaps } = await verifyProductAgainstPath(product, path);
    expect(isCompliant).toBe(false);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].issue).toContain('missing a required material');
  });

  it('should pass if one of several required keywords is present', async () => {
    const product = createMockProduct(90, [{ name: 'Steel' }]);
    const path = createMockPath('p5', { requiredKeywords: ['Steel', 'Titanium'] });
    const { isCompliant, gaps } = await verifyProductAgainstPath(product, path);
    expect(isCompliant).toBe(true);
    expect(gaps).toHaveLength(0);
  });

  it('should fail if a specific compliance flag is not set', async () => {
    const product = createMockProduct(80, [], { rohsCompliant: false });
    const path = createMockPath('p6', {}, ['RoHS']);
    const { isCompliant, gaps } = await verifyProductAgainstPath(product, path);
    expect(isCompliant).toBe(false);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].regulation).toBe('RoHS');
    expect(gaps[0].issue).toContain('not declared as RoHS compliant');
  });

  it('should identify multiple gaps at once', async () => {
    const product = createMockProduct(40, [{ name: 'Lead-based paint' }], { rohsCompliant: false });
    const path = createMockPath('p7', { minSustainabilityScore: 50, bannedKeywords: ['Lead'] }, ['RoHS']);
    const { isCompliant, gaps } = await verifyProductAgainstPath(product, path);
    expect(isCompliant).toBe(false);
    expect(gaps).toHaveLength(3);
  });
});

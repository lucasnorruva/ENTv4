// src/components/dashboards/admin-dashboard.tsx
import { getProducts } from '@/lib/actions/product-actions';
import { getServiceTickets } from '@/lib/actions/ticket-actions';
import { getAuditLogs } from '@/lib/actions/audit-actions';
import { getWebhooks } from '@/lib/actions/webhook-actions';
import { getCompanies, getUsers } from '@/lib/auth';
import type { User } from '@/types';
import AdminDashboardClient from './admin-dashboard-client';

export default async function AdminDashboard({ user }: { user: User }) {
  const [
    allUsers,
    allProducts,
    auditLogs,
    allCompanies,
    serviceTickets,
    webhooks,
  ] = await Promise.all([
    getUsers(),
    getProducts(), // Admin should see all products, remove user ID scope.
    getAuditLogs(),
    getCompanies(),
    getServiceTickets(), // Admin should see all service tickets.
    getWebhooks(), // Admin should see all webhooks.
  ]);

  const stats = {
    totalCompanies: allCompanies.length,
    totalUsers: allUsers.length,
    totalProducts: allProducts.length,
    verifiedPassports: allProducts.filter(
      p => p.verificationStatus === 'Verified',
    ).length,
    pendingReviews: allProducts.filter(p => p.verificationStatus === 'Pending')
      .length,
    failedVerifications: allProducts.filter(
      p => p.verificationStatus === 'Failed',
    ).length,
    openServiceTickets: serviceTickets.filter(t => t.status === 'Open').length,
    totalCreditsIssued: allUsers.reduce(
      (sum, u) => sum + (u.circularityCredits ?? 0),
      0,
    ),
  };

  const complianceChartData = {
    verified: stats.verifiedPassports,
    pending: stats.pendingReviews,
    failed: stats.failedVerifications,
  };

  const recentActivity = auditLogs.slice(0, 5);

  const entityMaps = {
    users: new Map(allUsers.map(u => [u.id, u.fullName])),
    products: new Map(allProducts.map(p => [p.id, p.productName])),
    companies: new Map(allCompanies.map(c => [c.id, c.name])),
    webhooks: new Map(webhooks.map(wh => [wh.id, wh.url])),
  };

  return (
    <AdminDashboardClient
      user={user}
      stats={stats}
      complianceChartData={complianceChartData}
      recentActivity={recentActivity}
      entityMaps={entityMaps}
    />
  );
}

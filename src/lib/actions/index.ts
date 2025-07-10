// src/lib/actions/index.ts
// This barrel file re-exports actions for easier importing.
// It uses explicit exports to avoid issues with the Next.js server action bundler.

export {
  getProducts,
  getProductById,
  getProductByGtin,
  processProductAi,
  saveProduct,
  deleteProduct,
  submitForReview,
  approvePassport,
  anchorProductOnChain,
  bulkAnchorProducts,
  rejectPassport,
  addCustodyStep,
  transferOwnership,
  generateZkProofForProduct,
  verifyZkProofForProduct,
  bulkDeleteProducts,
  bulkSubmitForReview,
  bulkArchiveProducts,
  markAsRecycled,
  resolveComplianceIssue,
  overrideVerification,
  performCustomsInspection,
  bulkCreateProducts,
  addServiceRecord,
} from './product-actions';

export {
  recalculateScore,
  runDataValidationCheck,
  runComplianceCheck,
  generateAndSaveProductImage,
  generateConformityDeclarationText,
  createProductFromImage,
  analyzeBillOfMaterials,
  suggestImprovements,
  generateProductDescription,
  generatePcdsForProduct,
  runLifecyclePrediction,
  askQuestionAboutProduct,
  getFriendlyError,
  analyzeElectronicsData,
  analyzeTextileData,
  analyzeFoodSafetyData,
  analyzeConstructionData,
  analyzeProductTransitRoute,
  analyzeSimulatedTransitRoute,
  runHsCodeClassification,
} from './product-ai-actions';

export {
  saveUser,
  deleteUser,
  createUserAndCompany,
  completeOnboarding,
  updateUserProfile,
  updateUserPassword,
  setMfaStatus,
  saveNotificationPreferences,
  markAllNotificationsAsRead,
  signInWithMockUser,
  bulkCreateUsers,
  getUserByEmail,
  deleteOwnAccount,
} from './user-actions';

export { saveCompany, deleteCompany } from './company-actions';

export {
  logAuditEvent,
  getAuditLogs,
  getAuditLogById,
  getAuditLogsForEntity,
  getAuditLogsForUser,
} from './audit-actions';

export {
  getCompliancePaths,
  getCompliancePathById,
  saveCompliancePath,
  deleteCompliancePath,
  generateCompliancePathRules,
  generateSmartContractForPath,
} from './compliance-actions';

export {
  getApiKeys,
  saveApiKey,
  revokeApiKey,
  deleteApiKey,
} from './api-key-actions';

export {
  getWebhooks,
  getWebhookById,
  saveWebhook,
  deleteWebhook,
  replayWebhook,
} from './webhook-actions';

export { saveApiSettings, saveCompanySettings } from './settings-actions';

export {
  exportProducts,
  exportComplianceReport,
  exportFullAuditTrail,
} from './report-actions';

export { getIntegrations, updateIntegrationStatus } from './integration-actions';
export { syncWithErp } from './sync-actions';

export {
  getProductionLines,
  getProductionLineById,
  saveProductionLine,
  deleteProductionLine,
} from './manufacturing-actions';

export {
  getServiceTickets,
  getServiceTicketById,
  saveServiceTicket,
  updateServiceTicketStatus,
  getSupportTickets,
  updateSupportTicketStatus,
  saveSupportTicket,
} from './ticket-actions';

export { globalSearch } from './search-actions';
export { generateComponentTest } from './dev-tool-actions';
export { runDailyComplianceCheck } from '@/triggers/scheduled-verifications';
export { runDailyReferenceDataSync } from '@/triggers/scheduled-syncs';
export { onProductChange } from '@/triggers/on-product-change';
export {
  getRegulationSources,
  runHealthCheck,
  runSync,
} from './regulation-sync-actions';

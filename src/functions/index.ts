// src/functions/index.ts

/**
 * This is the main entry point for all Firebase Functions.
 * From here, we export all the cloud functions (triggers, HTTP endpoints, etc.)
 * that we want to deploy.
 */

import "./ai-onboarding";
// Removed on-product-change trigger as we are using mock data for now.
// export * from "../triggers/on-product-change";

// src/lib/api-settings.ts
import type { ApiSettings } from '@/types';

// Mock settings data, lives here now.
export let apiSettings: ApiSettings = {
  isPublicApiEnabled: true,
  rateLimits: {
    free: 100,
    pro: 1000,
    enterprise: 10000,
  },
  isWebhookSigningEnabled: true,
};

/**
 * A direct data access function for API settings.
 * @returns A promise that resolves to the API settings object.
 */
export async function getApiSettingsData(): Promise<ApiSettings> {
  return Promise.resolve(apiSettings);
}

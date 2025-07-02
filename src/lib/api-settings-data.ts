// src/lib/api-settings-data.ts
import type { ApiSettings } from '@/types';

export let apiSettings: ApiSettings = {
  isPublicApiEnabled: true,
  rateLimits: {
    free: 100,
    pro: 1000,
    enterprise: 10000,
  },
  isWebhookSigningEnabled: true,
};

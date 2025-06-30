// src/lib/api-settings-data.ts
import type { ApiSettings } from '@/types';

export let apiSettings: ApiSettings = {
  isPublicApiEnabled: true,
  rateLimitPerMinute: 100,
  isWebhookSigningEnabled: true,
};

// src/services/rate-limiter.ts
'use server';

import { apiSettings as mockApiSettings } from '@/lib/api-settings';
import type { ApiRateLimit } from '@/types';

// This is a mock in-memory store for rate limits.
// In a real application, this would use Redis or Firestore.
const rateLimitStore: Record<string, ApiRateLimit> = {};

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Refill rate is tokens per second.
const REFILL_RATE = 2;

export async function checkRateLimit(
  keyId: string,
  tier: 'free' | 'pro' | 'enterprise' = 'pro',
  cost: number = 1,
): Promise<void> {
  // Use the mock settings data
  const settings = mockApiSettings;
  const bucketSize = settings.rateLimits[tier];

  // A limit of 0 means no limit is enforced
  if (bucketSize === 0) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const rateLimitData = rateLimitStore[keyId];

  if (!rateLimitData) {
    // First request, create a full bucket.
    rateLimitStore[keyId] = {
      tokens: bucketSize - cost,
      lastRefilled: now,
    };
    return;
  }

  // Calculate tokens to add since last request
  const timeElapsed = now - rateLimitData.lastRefilled;
  const tokensToAdd = timeElapsed * REFILL_RATE;

  let currentTokens = Math.min(
    rateLimitData.tokens + tokensToAdd,
    bucketSize, // Don't exceed the bucket size
  );

  if (currentTokens < cost) {
    throw new RateLimitError(
      `Rate limit exceeded. Try again in a few seconds.`,
    );
  }

  currentTokens -= cost;
  rateLimitStore[keyId] = { tokens: currentTokens, lastRefilled: now };
}

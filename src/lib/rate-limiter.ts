// src/lib/rate-limiter.ts
'use server';

import { getApiSettings } from './actions';

// This is a simple in-memory store for a mock environment.
// In a production system, you would use a persistent store like Redis.
const rateLimitStore = new Map<
  string,
  { count: number; windowStart: number }
>();
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Checks if a given key has exceeded the API rate limit.
 * Throws a RateLimitError if the limit is exceeded.
 *
 * @param key A unique identifier for the caller (e.g., API key token, user ID, IP address).
 */
export async function checkRateLimit(key: string): Promise<void> {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  const { rateLimits } = await getApiSettings();
  
  // For this mock, we'll assume all keys are on the "free" tier.
  const limit = rateLimits.free; 

  if (record && now - record.windowStart < WINDOW_SIZE_MS) {
    // Within the time window
    if (record.count >= limit) {
      throw new RateLimitError('API rate limit exceeded.');
    }
    rateLimitStore.set(key, { ...record, count: record.count + 1 });
  } else {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now });
  }
}

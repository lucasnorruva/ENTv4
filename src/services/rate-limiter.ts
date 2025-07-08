// src/services/rate-limiter.ts
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Collections } from '@/lib/constants';
import { getApiSettingsData } from '@/lib/api-settings';
import type { ApiRateLimit } from '@/types';

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
  const settings = await getApiSettingsData();
  const bucketSize = settings.rateLimits[tier];

  // A limit of 0 means no limit is enforced
  if (bucketSize === 0) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const docRef = adminDb.collection(Collections.API_RATE_LIMITS).doc(keyId);

  try {
    await adminDb.runTransaction(async transaction => {
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        // First request, create a full bucket.
        transaction.set(docRef, {
          tokens: bucketSize - cost,
          lastRefilled: now,
        });
        return;
      }

      const data = doc.data() as ApiRateLimit;

      // Calculate tokens to add since last request
      const timeElapsed = now - data.lastRefilled;
      const tokensToAdd = timeElapsed * REFILL_RATE;

      let currentTokens = Math.min(
        data.tokens + tokensToAdd,
        bucketSize, // Don't exceed the bucket size
      );

      if (currentTokens < cost) {
        throw new RateLimitError(
          `Rate limit exceeded. Try again in a few seconds.`,
        );
      }

      currentTokens -= cost;
      transaction.update(docRef, { tokens: currentTokens, lastRefilled: now });
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    console.error('Firestore rate-limiting transaction failed:', error);
    // Fail open for other transaction errors to not block legitimate traffic
  }
}

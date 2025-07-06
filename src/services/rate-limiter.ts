// src/services/rate-limiter.ts
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Collections } from '@/lib/constants';
import { getApiSettings } from '@/lib/actions/api-actions';
import type { ApiRateLimit } from '@/types';

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

const WINDOW_SIZE_IN_SECONDS = 60;

export async function checkRateLimit(
  keyId: string, // Can be a user ID or an API key ID
  tier: 'free' | 'pro' | 'enterprise' = 'pro', // Default to 'pro' for mock
): Promise<void> {
  const settings = await getApiSettings();
  const limit = settings.rateLimits[tier];
  
  // A limit of 0 means no limit is enforced
  if (limit === 0) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % WINDOW_SIZE_IN_SECONDS);

  const docRef = adminDb.collection(Collections.API_RATE_LIMITS).doc(keyId);

  try {
    await adminDb.runTransaction(async transaction => {
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        transaction.set(docRef, { count: 1, windowStart });
        return;
      }

      const data = doc.data() as ApiRateLimit;

      if (data.windowStart === windowStart) {
        if (data.count >= limit) {
          throw new RateLimitError(
            `Rate limit of ${limit} requests per minute exceeded.`,
          );
        }
        transaction.update(docRef, { count: data.count + 1 });
      } else {
        // New window, reset the count
        transaction.set(docRef, { count: 1, windowStart });
      }
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    // For other transaction errors, we can choose to fail open to not block legit traffic
    console.error('Firestore rate-limiting transaction failed: ', error);
  }
}

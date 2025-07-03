// src/lib/rate-limiter.ts
'use server';

import { getApiSettings } from './actions';
import { adminDb } from './firebase-admin';
import { Collections } from './constants';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const WINDOW_SIZE_MS = 60 * 1000; // 1 minute

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Checks if a given key has exceeded the API rate limit using Firestore for persistence.
 * Throws a RateLimitError if the limit is exceeded.
 *
 * @param key A unique identifier for the caller (e.g., user ID).
 */
export async function checkRateLimit(key: string): Promise<void> {
  const { rateLimits } = await getApiSettings();
  const limit = rateLimits.free; // Assuming a single tier for simplicity

  const docRef = adminDb.collection(Collections.API_RATE_LIMITS).doc(key);
  const now = Timestamp.now();

  try {
    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const windowStart = now.toMillis() - WINDOW_SIZE_MS;

      if (
        !doc.exists ||
        !doc.data()?.windowStart ||
        doc.data()!.windowStart.toMillis() < windowStart
      ) {
        // Start a new window
        transaction.set(docRef, {
          count: 1,
          windowStart: now,
        });
      } else {
        // Within the current window
        const data = doc.data()!;
        if (data.count >= limit) {
          throw new RateLimitError('API rate limit exceeded.');
        }
        transaction.update(docRef, { count: FieldValue.increment(1) });
      }
    });
  } catch (error) {
    // If the error is a RateLimitError, rethrow it. Otherwise, log it.
    if (error instanceof RateLimitError) {
      throw error;
    }
    console.error('Error during rate limit transaction:', error);
    // Fail open in case of Firestore error, or you could choose to fail closed.
    // For now, we will let the request through if the DB transaction fails.
  }
}

// src/services/webhooks.ts
'use server';

import type { Product } from '@/types';
import { getApiSettings } from '@/lib/actions';
import { createHmac } from 'crypto';

// In a real app, this would be a securely stored secret from a secret manager.
const WEBHOOK_SECRET =
  process.env.WEBHOOK_SECRET || 'mock-secret-for-development';

/**
 * Sends a webhook notification to a specified URL.
 * @param url The URL to send the webhook to.
 * @param event The name of the event being triggered.
 * @param payload The data payload to send with the webhook.
 */
export async function sendWebhook(
  url: string,
  event: string,
  payload: Product,
) {
  console.log(`Sending webhook for event '${event}' to URL: ${url}`);

  const apiSettings = await getApiSettings();
  const body = JSON.stringify({
    event,
    createdAt: new Date().toISOString(),
    payload,
  });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'User-Agent': 'Norruva-Webhook/1.0',
    'X-Norruva-Event': event,
  };

  if (apiSettings.isWebhookSigningEnabled) {
    const signature = createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
    headers['X-Norruva-Signature'] = signature;
    console.log(`Webhook signed with signature: ${signature}`);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      console.error(
        `Webhook failed for ${url}. Status: ${response.status} ${response.statusText}`,
      );
      // In a real app, you would implement retry logic here (e.g., with a queue).
    } else {
      console.log(`Webhook sent successfully to ${url}.`);
    }
  } catch (error) {
    console.error(`Error sending webhook to ${url}:`, error);
  }
}

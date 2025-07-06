// src/services/webhooks.ts
'use server';

import type { Product, Webhook } from '@/types';
import { getApiSettings } from '@/lib/actions/api-actions';
import { logAuditEvent } from '@/lib/actions/audit-actions';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET =
  process.env.WEBHOOK_SECRET || 'mock-secret-for-development';

export async function sendWebhook(
  webhook: Webhook,
  event: string,
  payload: Product,
) {
  const { url, userId } = webhook;
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
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    await logAuditEvent(
      response.ok ? 'webhook.delivery.success' : 'webhook.delivery.failure',
      webhook.id,
      {
        event,
        statusCode: response.status,
        productId: payload.id,
        url,
        payload: body, // Store the sent payload
      },
      userId,
    );

    if (!response.ok) {
      console.error(
        `Webhook failed for ${url}. Status: ${response.status} ${response.statusText}`,
      );
    } else {
      console.log(`Webhook sent successfully to ${url}.`);
    }
  } catch (error) {
    console.error(`Error sending webhook to ${url}:`, error);
    await logAuditEvent(
      'webhook.delivery.failure',
      webhook.id,
      {
        event,
        statusCode: 500,
        error: (error as Error).message,
        productId: payload.id,
        url,
        payload: body, // Store the payload even on network failure
      },
      userId,
    );
  }
}

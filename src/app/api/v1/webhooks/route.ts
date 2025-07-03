// src/app/api/v1/webhooks/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getWebhooks, saveWebhook, logAuditEvent } from '@/lib/actions';
import { authenticateApiRequest } from '@/lib/api-auth';
import { PermissionError } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiRequest();
    const webhooks = await getWebhooks(user.id);
    const webhooksWithLinks = webhooks.map(webhook => ({
      ...webhook,
      _links: {
        self: { href: `/api/v1/webhooks/${webhook.id}` },
      },
    }));
    return NextResponse.json(webhooksWithLinks);
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await authenticateApiRequest();
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const endpoint = '/api/v1/webhooks';
  const body = await request.json();

  try {
    const newWebhook = await saveWebhook(body, user.id);
    await logAuditEvent('api.webhook.post', newWebhook.id, { endpoint, status: 201, method: 'POST' }, user.id);
    const webhookWithLinks = {
        ...newWebhook,
        _links: {
          self: { href: `/api/v1/webhooks/${newWebhook.id}` },
        },
    };
    return NextResponse.json(webhookWithLinks, { status: 201 });
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      await logAuditEvent('api.webhook.post', 'N/A', { endpoint, status: 400, error: 'Invalid data', method: 'POST' }, user.id);
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.errors },
        { status: 400 },
      );
    }
    console.error('API Webhook Creation Error:', error);
    await logAuditEvent('api.webhook.post', 'N/A', { endpoint, status: 500, error: 'Internal Server Error', method: 'POST' }, user.id);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

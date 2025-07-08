// src/app/api/v1/webhooks/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getWebhooks, saveWebhook } from '@/lib/actions/webhook-actions';
import { logAuditEvent } from '@/lib/actions/audit-actions';
import { authenticateApiRequest } from '@/lib/api-auth';
import { PermissionError } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let user;
  const endpoint = '/api/v1/webhooks';
  try {
    const { user: authUser } = await authenticateApiRequest();
    user = authUser;
    const webhooks = await getWebhooks(user.id);
    const webhooksWithLinks = webhooks.map(webhook => ({
      ...webhook,
      _links: {
        self: { href: `/api/v1/webhooks/${webhook.id}` },
      },
    }));
    await logAuditEvent(
      'api.webhook.get_all',
      'N/A',
      { endpoint, status: 200, method: 'GET', latencyMs: Date.now() - startTime },
      user.id,
    );
    return NextResponse.json(webhooksWithLinks);
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (user) {
      await logAuditEvent(
        'api.webhook.get_all',
        'N/A',
        { endpoint, status: 500, error: 'Internal Server Error', method: 'GET', latencyMs: Date.now() - startTime },
        user.id,
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let user;
  const endpoint = '/api/v1/webhooks';
  try {
    const { user: authUser } = await authenticateApiRequest();
    user = authUser;
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }

  const body = await request.json();

  try {
    const newWebhook = await saveWebhook(body, user.id);
    await logAuditEvent(
      'api.webhook.post',
      newWebhook.id,
      { endpoint, status: 201, method: 'POST', latencyMs: Date.now() - startTime },
      user.id,
    );
    const webhookWithLinks = {
      ...newWebhook,
      _links: {
        self: { href: `/api/v1/webhooks/${newWebhook.id}` },
      },
    };
    return NextResponse.json(webhookWithLinks, { status: 201 });
  } catch (error: any) {
    if (error instanceof PermissionError) {
      await logAuditEvent(
        'api.webhook.post',
        'N/A',
        { endpoint, status: 403, error: error.message, method: 'POST', latencyMs: Date.now() - startTime },
        user.id,
      );
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      await logAuditEvent(
        'api.webhook.post',
        'N/A',
        { endpoint, status: 400, error: 'Invalid data', method: 'POST', latencyMs: Date.now() - startTime },
        user.id,
      );
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.errors },
        { status: 400 },
      );
    }
    console.error('API Webhook Creation Error:', error);
    await logAuditEvent(
      'api.webhook.post',
      'N/A',
      { endpoint, status: 500, error: 'Internal Server Error', method: 'POST', latencyMs: Date.now() - startTime },
      user.id,
    );
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

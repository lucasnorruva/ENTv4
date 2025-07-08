// src/app/api/v1/webhooks/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import {
  getWebhookById,
  saveWebhook,
  deleteWebhook,
} from '@/lib/actions/webhook-actions';
import { logAuditEvent } from '@/lib/actions/audit-actions';
import { authenticateApiRequest } from '@/lib/api-auth';
import { PermissionError } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const startTime = Date.now();
  let user;
  const endpoint = `/api/v1/webhooks/${params.id}`;
  try {
    const { user: authUser } = await authenticateApiRequest();
    user = authUser;
    const webhook = await getWebhookById(params.id, user.id);

    if (!webhook) {
      await logAuditEvent(
        'api.webhook.get',
        params.id,
        { endpoint, status: 404, method: 'GET', latencyMs: Date.now() - startTime },
        user.id,
      );
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhookWithLinks = {
      ...webhook,
      _links: {
        self: { href: `/api/v1/webhooks/${webhook.id}` },
      },
    };

    await logAuditEvent(
      'api.webhook.get',
      params.id,
      { endpoint, status: 200, method: 'GET', latencyMs: Date.now() - startTime },
      user.id,
    );
    return NextResponse.json(webhookWithLinks);
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (user) {
      await logAuditEvent(
        'api.webhook.get',
        params.id,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const startTime = Date.now();
  let user;
  const endpoint = `/api/v1/webhooks/${params.id}`;
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
    const updatedWebhook = await saveWebhook(body, user.id, params.id);
    await logAuditEvent(
      'api.webhook.put',
      params.id,
      { endpoint, status: 200, method: 'PUT', latencyMs: Date.now() - startTime },
      user.id,
    );
    const webhookWithLinks = {
      ...updatedWebhook,
      _links: {
        self: { href: `/api/v1/webhooks/${updatedWebhook.id}` },
      },
    };
    return NextResponse.json(webhookWithLinks);
  } catch (error: any) {
    if (error instanceof PermissionError) {
      await logAuditEvent(
        'api.webhook.put',
        params.id,
        { endpoint, status: 403, error: error.message, method: 'PUT', latencyMs: Date.now() - startTime },
        user.id,
      );
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      await logAuditEvent(
        'api.webhook.put',
        params.id,
        { endpoint, status: 400, error: 'Invalid data', method: 'PUT', latencyMs: Date.now() - startTime },
        user.id,
      );
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.errors },
        { status: 400 },
      );
    }
    await logAuditEvent(
      'api.webhook.put',
      params.id,
      {
        endpoint,
        status: 500,
        error: 'Internal Server Error',
        method: 'PUT',
        latencyMs: Date.now() - startTime
      },
      user.id,
    );
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const startTime = Date.now();
  let user;
  const endpoint = `/api/v1/webhooks/${params.id}`;
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

  try {
    await deleteWebhook(params.id, user.id);
    await logAuditEvent(
      'api.webhook.delete',
      params.id,
      { endpoint, status: 204, method: 'DELETE', latencyMs: Date.now() - startTime },
      user.id,
    );
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error instanceof PermissionError) {
      await logAuditEvent(
        'api.webhook.delete',
        params.id,
        { endpoint, status: 403, error: error.message, method: 'DELETE', latencyMs: Date.now() - startTime },
        user.id,
      );
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    await logAuditEvent(
      'api.webhook.delete',
      params.id,
      {
        endpoint,
        status: 500,
        error: 'Internal Server Error',
        method: 'DELETE',
        latencyMs: Date.now() - startTime
      },
      user.id,
    );
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

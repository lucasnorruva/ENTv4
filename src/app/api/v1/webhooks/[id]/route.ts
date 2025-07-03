// src/app/api/v1/webhooks/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import {
  getWebhookById,
  saveWebhook,
  deleteWebhook,
  logAuditEvent,
} from '@/lib/actions';
import { authenticateApiRequest } from '@/lib/api-auth';
import { PermissionError } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticateApiRequest();
    const webhook = await getWebhookById(params.id, user.id);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhookWithLinks = {
      ...webhook,
      _links: {
        self: { href: `/api/v1/webhooks/${webhook.id}` },
      },
    };

    return NextResponse.json(webhookWithLinks);
  } catch (error: any) {
     if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let user;
  const endpoint = `/api/v1/webhooks/${params.id}`;
  try {
    user = await authenticateApiRequest();
  } catch (error: any) {
     if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const body = await request.json();

  try {
    const updatedWebhook = await saveWebhook(body, user.id, params.id);
    await logAuditEvent(
      'api.webhook.put',
      params.id,
      { endpoint, status: 200, method: 'PUT' },
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
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.errors },
        { status: 400 },
      );
    }
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
  let user;
  try {
    user = await authenticateApiRequest();
  } catch (error: any) {
     if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  try {
    await deleteWebhook(params.id, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
     if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

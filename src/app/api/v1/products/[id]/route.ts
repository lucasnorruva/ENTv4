// src/app/api/v1/products/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import {
  getProductById,
  saveProduct,
  deleteProduct,
  logAuditEvent,
} from '@/lib/actions';
import { authenticateApiRequest } from '@/lib/api-auth';
import { PermissionError } from '@/lib/permissions';
import { RateLimitError } from '@/services/rate-limiter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let user;
  const endpoint = `/api/v1/products/${params.id}`;
  try {
    user = await authenticateApiRequest();
    const product = await getProductById(params.id, user.id);

    if (!product) {
      await logAuditEvent(
        'api.get',
        params.id,
        { endpoint, status: 404, method: 'GET' },
        user.id,
      );
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productWithLinks = {
      ...product,
      _links: {
        self: { href: `/api/v1/products/${product.id}` },
        complianceCheck: { href: `/api/v1/compliance/check/${product.id}` },
      },
    };

    await logAuditEvent(
      'api.get',
      params.id,
      { endpoint, status: 200, method: 'GET' },
      user.id,
    );
    return NextResponse.json(productWithLinks);
  } catch (error: any) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    // Don't log 500 errors if user context is missing.
    if (user) {
      await logAuditEvent(
        'api.get',
        params.id,
        { endpoint, status: 500, error: error.message, method: 'GET' },
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
  let user;
  const endpoint = `/api/v1/products/${params.id}`;
  try {
    user = await authenticateApiRequest();
  } catch (error: any) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
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
    const updatedProduct = await saveProduct(body, user.id, params.id);
    await logAuditEvent(
      'api.put',
      params.id,
      { endpoint, status: 200, method: 'PUT' },
      user.id,
    );
    const productWithLinks = {
      ...updatedProduct,
      _links: {
        self: { href: `/api/v1/products/${updatedProduct.id}` },
      },
    };
    return NextResponse.json(productWithLinks);
  } catch (error: any) {
    if (error instanceof PermissionError) {
      await logAuditEvent(
        'api.put',
        params.id,
        { endpoint, status: 403, error: error.message, method: 'PUT' },
        user.id,
      );
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      await logAuditEvent(
        'api.put',
        params.id,
        { endpoint, status: 400, error: 'Invalid data', method: 'PUT' },
        user.id,
      );
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.errors },
        { status: 400 },
      );
    }
    console.error(`API Product Update Error (ID: ${params.id}):`, error);
    await logAuditEvent(
      'api.put',
      params.id,
      {
        endpoint,
        status: 500,
        error: 'Internal Server Error',
        method: 'PUT',
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
  let user;
  const endpoint = `/api/v1/products/${params.id}`;
  try {
    user = await authenticateApiRequest();
  } catch (error: any) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }

  try {
    const product = await getProductById(params.id, user.id);
    if (!product) {
      await logAuditEvent(
        'api.delete',
        params.id,
        { endpoint, status: 404, error: 'Not Found', method: 'DELETE' },
        user.id,
      );
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await deleteProduct(params.id, user.id);
    await logAuditEvent(
      'api.delete',
      params.id,
      { endpoint, status: 204, method: 'DELETE' },
      user.id,
    );
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error instanceof PermissionError) {
      await logAuditEvent(
        'api.delete',
        params.id,
        { endpoint, status: 403, error: error.message, method: 'DELETE' },
        user.id,
      );
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error(`API Product Deletion Error (ID: ${params.id}):`, error);
    await logAuditEvent(
      'api.delete',
      params.id,
      {
        endpoint,
        status: 500,
        error: 'Internal Server Error',
        method: 'DELETE',
      },
      user.id,
    );
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

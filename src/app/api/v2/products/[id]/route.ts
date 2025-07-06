// src/app/api/v2/products/[id]/route.ts
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
import type { Product } from '@/types';

function formatProductResponse(product: Product) {
  return {
    ...product,
    _links: {
      self: { href: `/api/v2/products/${product.id}` },
      // Placeholder for a future v2 compliance check endpoint
      // complianceCheck: { href: `/api/v2/compliance/check/${product.id}` },
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let user;
  const endpoint = `/api/v2/products/${params.id}`;
  try {
    user = await authenticateApiRequest();
    const product = await getProductById(params.id, user.id);

    if (!product) {
      await logAuditEvent(
        'api.v2.get.id',
        params.id,
        { endpoint, status: 404, method: 'GET' },
        user.id,
      );
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productWithLinks = formatProductResponse(product);

    await logAuditEvent(
      'api.v2.get.id',
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
        'api.v2.get.id',
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
  const endpoint = `/api/v2/products/${params.id}`;
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
      'api.v2.put',
      params.id,
      { endpoint, status: 200, method: 'PUT' },
      user.id,
    );
    const productWithLinks = formatProductResponse(updatedProduct);
    return NextResponse.json(productWithLinks);
  } catch (error: any) {
    const errorDetails: Record<string, any> = {
      endpoint,
      method: 'PUT',
      error: error.message || 'Internal Server Error',
    };

    if (error instanceof PermissionError) {
      errorDetails.status = 403;
      await logAuditEvent('api.v2.put', params.id, errorDetails, user.id);
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      errorDetails.status = 400;
      errorDetails.error = 'Invalid data';
      await logAuditEvent('api.v2.put', params.id, errorDetails, user.id);
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.errors },
        { status: 400 },
      );
    }

    errorDetails.status = 500;
    console.error(`API v2 Product Update Error (ID: ${params.id}):`, error);
    await logAuditEvent('api.v2.put', params.id, errorDetails, user.id);
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
  const endpoint = `/api/v2/products/${params.id}`;
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
        'api.v2.delete',
        params.id,
        { endpoint, status: 404, error: 'Not Found', method: 'DELETE' },
        user.id,
      );
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await deleteProduct(params.id, user.id);
    await logAuditEvent(
      'api.v2.delete',
      params.id,
      { endpoint, status: 204, method: 'DELETE' },
      user.id,
    );
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    const errorDetails: Record<string, any> = {
      endpoint,
      method: 'DELETE',
      error: error.message || 'Internal Server Error',
    };

    if (error instanceof PermissionError) {
      errorDetails.status = 403;
      await logAuditEvent('api.v2.delete', params.id, errorDetails, user.id);
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    errorDetails.status = 500;
    console.error(`API v2 Product Deletion Error (ID: ${params.id}):`, error);
    await logAuditEvent('api.v2.delete', params.id, errorDetails, user.id);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

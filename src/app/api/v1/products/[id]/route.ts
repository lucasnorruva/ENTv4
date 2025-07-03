// src/app/api/v1/products/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import {
  getProductById,
  saveProduct,
  deleteProduct,
  logAuditEvent,
} from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/types';
import { PermissionError } from '@/lib/permissions';

// In a real app, this would be a middleware or helper function
// to extract the user from the Authorization header.
async function getApiUser(request: NextRequest): Promise<User> {
  // For this mock, we'll use a hardcoded role.
  // A real implementation would verify a JWT.
  return getCurrentUser('Developer');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getApiUser(request);
    const product = await getProductById(params.id, user.id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productWithLinks = {
      ...product,
      _links: {
        self: { href: `/api/v1/products/${product.id}` },
        complianceCheck: { href: `/api/v1/compliance/check/${product.id}` },
      },
    };

    return NextResponse.json(productWithLinks);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 },
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
    user = await getApiUser(request);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 },
    );
  }

  const body = await request.json();

  try {
    // The saveProduct action handles validation and authorization
    const updatedProduct = await saveProduct(body, user.id, params.id);
    await logAuditEvent(
      'api.put',
      params.id,
      { endpoint, status: 200, method: 'PUT' },
      user.id,
    );
    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    if (error instanceof PermissionError) {
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
    user = await getApiUser(request);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 },
    );
  }

  try {
    // Check if product exists before deleting
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

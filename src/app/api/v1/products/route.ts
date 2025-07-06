// src/app/api/v1/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getProducts, saveProduct } from '@/lib/actions/product-actions';
import { logAuditEvent } from '@/lib/actions/audit-actions';
import { authenticateApiRequest } from '@/lib/api-auth';
import { PermissionError } from '@/lib/permissions';
import { RateLimitError } from '@/services/rate-limiter';

export async function GET(request: NextRequest) {
  let user;
  const endpoint = '/api/v1/products';
  try {
    user = await authenticateApiRequest();
    const products = await getProducts(user.id);
    const productsWithLinks = products.map(product => ({
      ...product,
      _links: {
        self: { href: `/api/v1/products/${product.id}` },
      },
    }));
    await logAuditEvent(
      'api.get',
      'all_products',
      { endpoint, status: 200, method: 'GET' },
      user.id,
    );
    return NextResponse.json(productsWithLinks);
  } catch (error: any) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    // Don't log if user context is missing
    if (user) {
      await logAuditEvent(
        'api.get',
        'all_products',
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

export async function POST(request: NextRequest) {
  let user;
  const endpoint = '/api/v1/products';
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
    const newProduct = await saveProduct(body, user.id);
    await logAuditEvent(
      'api.post',
      newProduct.id,
      { endpoint, status: 201, method: 'POST' },
      user.id,
    );
    const productWithLinks = {
      ...newProduct,
      _links: {
        self: { href: `/api/v1/products/${newProduct.id}` },
      },
    };
    return NextResponse.json(productWithLinks, { status: 201 });
  } catch (error: any) {
    if (error instanceof PermissionError) {
      await logAuditEvent(
        'api.post',
        'N/A',
        { endpoint, status: 403, error: error.message, method: 'POST' },
        user.id,
      );
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      await logAuditEvent(
        'api.post',
        'N/A',
        { endpoint, status: 400, error: 'Invalid data', method: 'POST' },
        user.id,
      );
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.errors },
        { status: 400 },
      );
    }
    console.error('API Product Creation Error:', error);
    await logAuditEvent(
      'api.post',
      'N/A',
      { endpoint, status: 500, error: 'Internal Server Error', method: 'POST' },
      user.id,
    );
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

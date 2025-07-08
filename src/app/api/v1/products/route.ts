// src/app/api/v1/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import {
  getProducts,
  saveProduct,
} from '@/lib/actions/product-actions';
import { logAuditEvent } from '@/lib/actions/audit-actions';
import { authenticateApiRequest } from '@/lib/api-auth';
import { PermissionError } from '@/lib/permissions';
import { RateLimitError, checkRateLimit } from '@/services/rate-limiter';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let user;
  const endpoint = '/api/v1/products';
  try {
    const { user: authUser, apiKey, company } = await authenticateApiRequest();
    user = authUser;
    await checkRateLimit(apiKey.id, company.tier, 1);

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
      { endpoint, status: 200, method: 'GET', latencyMs: Date.now() - startTime },
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
        { endpoint, status: 500, error: error.message, method: 'GET', latencyMs: Date.now() - startTime },
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
  const endpoint = '/api/v1/products';
  try {
    const { user: authUser, apiKey, company } = await authenticateApiRequest();
    user = authUser;
    await checkRateLimit(apiKey.id, company.tier, 10); // Higher cost for creating products
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
      { endpoint, status: 201, method: 'POST', latencyMs: Date.now() - startTime },
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
        { endpoint, status: 403, error: error.message, method: 'POST', latencyMs: Date.now() - startTime },
        user.id,
      );
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      await logAuditEvent(
        'api.post',
        'N/A',
        { endpoint, status: 400, error: 'Invalid data', method: 'POST', latencyMs: Date.now() - startTime },
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
      { endpoint, status: 500, error: 'Internal Server Error', method: 'POST', latencyMs: Date.now() - startTime },
      user.id,
    );
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

// src/app/api/v2/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getProducts, saveProduct, logAuditEvent } from '@/lib/actions';
import { authenticateApiRequest } from '@/lib/api-auth';
import { PermissionError } from '@/lib/permissions';
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

export async function GET(request: NextRequest) {
  let user;
  const endpoint = '/api/v2/products';
  try {
    user = await authenticateApiRequest();
    const products = await getProducts(user.id);
    const productsWithLinks = products.map(formatProductResponse);
    await logAuditEvent(
      'api.v2.get',
      'all_products',
      { endpoint, status: 200, method: 'GET' },
      user.id,
    );
    return NextResponse.json(productsWithLinks);
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (user) {
      await logAuditEvent(
        'api.v2.get',
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
  const endpoint = '/api/v2/products';
  try {
    user = await authenticateApiRequest();
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
    const newProduct = await saveProduct(body, user.id);
    await logAuditEvent(
      'api.v2.post',
      newProduct.id,
      { endpoint, status: 201, method: 'POST' },
      user.id,
    );
    const productWithLinks = formatProductResponse(newProduct);
    return NextResponse.json(productWithLinks, { status: 201 });
  } catch (error: any) {
    const errorDetails: Record<string, any> = {
      endpoint,
      method: 'POST',
      error: error.message || 'Internal Server Error',
    };

    if (error instanceof PermissionError) {
      errorDetails.status = 403;
      await logAuditEvent('api.v2.post', 'N/A', errorDetails, user.id);
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      errorDetails.status = 400;
      errorDetails.error = 'Invalid data';
      await logAuditEvent('api.v2.post', 'N/A', errorDetails, user.id);
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.errors },
        { status: 400 },
      );
    }
    
    errorDetails.status = 500;
    console.error('API v2 Product Creation Error:', error);
    await logAuditEvent('api.v2.post', 'N/A', errorDetails, user.id);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

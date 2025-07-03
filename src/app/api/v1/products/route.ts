// src/app/api/v1/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getProducts, saveProduct, logAuditEvent } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/types';
import { PermissionError } from '@/lib/permissions';

// In a real app, this would be a middleware or helper function
// to extract the user from the Authorization header.
async function getApiUser(request: NextRequest): Promise<User> {
  // For this mock, we'll use a hardcoded role.
  // A real implementation would verify a JWT.
  // The "Developer" role seems appropriate for API access.
  return getCurrentUser('Developer');
}

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    // The getProducts action already handles role-based filtering
    const products = await getProducts(user.id);
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await getApiUser(request);
  } catch (error: any) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  const endpoint = '/api/v1/products';
  const body = await request.json();

  try {
    // The saveProduct action will handle validation against the schema
    const newProduct = await saveProduct(body, user.id);
    await logAuditEvent('api.post', newProduct.id, { endpoint, status: 201, method: 'POST' }, user.id);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    // Check if it's a Zod validation error
    if (error.name === 'ZodError') {
      await logAuditEvent('api.post', 'N/A', { endpoint, status: 400, error: 'Invalid data', method: 'POST' }, user.id);
      return NextResponse.json(
        { message: 'Invalid data provided', details: error.errors },
        { status: 400 },
      );
    }
    console.error('API Product Creation Error:', error);
    await logAuditEvent('api.post', 'N/A', { endpoint, status: 500, error: 'Internal Server Error', method: 'POST' }, user.id);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

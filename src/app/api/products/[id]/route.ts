// src/app/api/products/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getProductById } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/types';

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

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

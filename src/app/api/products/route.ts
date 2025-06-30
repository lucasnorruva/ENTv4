// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/actions';

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

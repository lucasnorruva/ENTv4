// src/app/api/compliance/check/[productId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import {
  getProductById,
  getCompliancePathById,
  logAuditEvent,
} from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/types';
import { summarizeComplianceGaps } from '@/ai/flows/summarize-compliance-gaps';
import type { AiProduct } from '@/ai/schemas';

async function getApiUser(request: NextRequest): Promise<User> {
  // Mock user for API access
  return getCurrentUser('Developer');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  let user;
  try {
    user = await getApiUser(request);
  } catch (error: any) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const product = await getProductById(params.productId, user.id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (!product.compliancePathId) {
      return NextResponse.json(
        { error: 'Product has no compliance path assigned' },
        { status: 400 },
      );
    }

    const compliancePath = await getCompliancePathById(product.compliancePathId);
    if (!compliancePath) {
      return NextResponse.json(
        { error: `Compliance path ${product.compliancePathId} not found` },
        { status: 400 },
      );
    }

    const aiProductInput: AiProduct = {
      productName: product.productName,
      productDescription: product.productDescription,
      category: product.category,
      supplier: product.supplier,
      materials: product.materials,
      manufacturing: product.manufacturing,
      certifications: product.certifications,
      verificationStatus: product.verificationStatus ?? 'Not Submitted',
      complianceSummary: product.sustainability?.complianceSummary,
    };

    const result = await summarizeComplianceGaps({
      product: aiProductInput,
      compliancePath: compliancePath,
    });

    await logAuditEvent(
      'api.compliance.check',
      product.id,
      { result },
      user.id,
    );

    return NextResponse.json({
      productId: product.id,
      status: result.isCompliant ? 'Verified' : 'Failed',
      summary: result.complianceSummary,
      gaps: result.gaps,
    });
  } catch (error: any) {
    console.error('API Compliance Check Error:', error);
    await logAuditEvent(
      'api.compliance.check',
      params.productId,
      { error: 'Internal Server Error' },
      user.id,
    );
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

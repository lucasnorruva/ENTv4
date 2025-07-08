// src/app/api/v1/compliance/check/[productId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getProductById } from '@/lib/actions/product-actions';
import { runComplianceCheck } from '@/lib/actions/product-ai-actions';
import { logAuditEvent } from '@/lib/actions/audit-actions';
import { authenticateApiRequest } from '@/lib/api-auth';
import { PermissionError } from '@/lib/permissions';
import { RateLimitError, checkRateLimit } from '@/services/rate-limiter';

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  let user;
  const endpoint = `/api/v1/compliance/check/${params.productId}`;

  try {
    const { user: authUser, apiKey, company } = await authenticateApiRequest();
    user = authUser;
    // This is an expensive, AI-powered action, so it has a high cost.
    await checkRateLimit(apiKey.id, company.tier, 20);
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
    const product = await getProductById(params.productId, user.id);
    if (!product) {
      await logAuditEvent(
        'api.compliance.check',
        params.productId,
        { error: 'Product not found', endpoint, method: 'POST', status: 404 },
        user.id,
      );
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (!product.compliancePathId) {
      await logAuditEvent(
        'api.compliance.check',
        params.productId,
        {
          error: 'Product has no compliance path assigned',
          endpoint,
          method: 'POST',
          status: 400,
        },
        user.id,
      );
      return NextResponse.json(
        { error: 'Product has no compliance path assigned' },
        { status: 400 },
      );
    }

    // Trigger the background check. This is an async process.
    await runComplianceCheck(product.id, user.id);

    // The API returns immediately to not block the client.
    const response = {
      productId: product.id,
      status: 'In Progress',
      summary:
        'Compliance check has been initiated. The results will be available shortly.',
    };

    await logAuditEvent(
      'api.compliance.check',
      product.id,
      {
        result: 'initiated',
        endpoint,
        method: 'POST',
        status: 202,
      },
      user.id,
    );

    return NextResponse.json(response, { status: 202 });
  } catch (error: any) {
    console.error('API Compliance Check Error:', error);
    await logAuditEvent(
      'api.compliance.check',
      params.productId,
      {
        error: 'Internal Server Error',
        endpoint,
        method: 'POST',
        status: 500,
      },
      user.id,
    );
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 },
    );
  }
}

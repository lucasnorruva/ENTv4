// src/app/api/v1/dpp/graph/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getProductById } from '@/lib/actions/product-actions';
import { getCompanyById } from '@/lib/auth';
import { MOCK_SUPPLIERS } from '@/lib/supplier-data';

interface GraphNode {
  id: string;
  label: string;
  type: 'product' | 'manufacturer' | 'supplier' | 'component';
  data?: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const product = await getProductById(params.id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const company = await getCompanyById(product.companyId);

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 1. Add Product Node
    nodes.push({
      id: product.id,
      label: product.productName,
      type: 'product',
      data: { category: product.category },
    });

    // 2. Add Manufacturer Node
    if (company) {
      nodes.push({
        id: company.id,
        label: company.name,
        type: 'manufacturer',
        data: { industry: company.industry, location: 'Unknown' }, // Mock location
      });
      edges.push({
        id: `edge-${company.id}-${product.id}`,
        source: company.id,
        target: product.id,
        label: 'produced',
      });
    }

    // 3. Add Material and Supplier Nodes
    product.materials.forEach((material, index) => {
      const materialId = `mat-${product.id}-${index}`;
      nodes.push({
        id: materialId,
        label: material.name,
        type: 'component',
        data: { percentage: material.percentage, origin: material.origin },
      });
      edges.push({
        id: `edge-${materialId}-${product.id}`,
        source: materialId,
        target: product.id,
        label: 'is part of',
      });

      // Find a mock supplier based on origin country
      const supplier = MOCK_SUPPLIERS.find(s => s.location === material.origin);
      if (supplier) {
        // Add supplier node only if it doesn't exist
        if (!nodes.some(n => n.id === supplier.id)) {
          nodes.push({
            id: supplier.id,
            label: supplier.name,
            type: 'supplier',
            data: { location: supplier.location },
          });
        }
        edges.push({
          id: `edge-${supplier.id}-${materialId}`,
          source: supplier.id,
          target: materialId,
          label: 'supplied by',
        });
      }
    });

    const graphData: GraphData = { nodes, edges };

    return NextResponse.json(graphData);
  } catch (error: unknown) {
    // Log the actual error for debugging purposes
    if (error instanceof Error) {
 console.error('API Error fetching supply chain graph:', error.message);
    }
    console.error('API Error fetching supply chain graph:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// src/app/api/v1/dpp/graph/[productId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProductById } from '@/lib/actions';
import { MOCK_SUPPLIERS } from '@/lib/supplier-data';

interface GraphNode {
  id: string;
  label: string;
  type: 'product' | 'manufacturer' | 'supplier' | 'component';
  data?: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  label: string; // Relationship type
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  const productId = params.productId;
  // In a real app, you would validate an API key here.

  const product = await getProductById(productId);

  await new Promise(resolve => setTimeout(resolve, 180));

  if (!product) {
    return NextResponse.json(
      { error: { code: 404, message: `Product with ID ${productId} not found.` } },
      { status: 404 },
    );
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Product Node
  nodes.push({
    id: product.id,
    label: product.productName,
    type: 'product',
    data: { category: product.category, gtin: product.gtin },
  });

  // Manufacturer Node & Edge
  if (product.supplier) {
    const manufacturerId = `mfg_${product.supplier.replace(/\s+/g, '_')}`;
    if (!nodes.find(n => n.id === manufacturerId)) {
        nodes.push({
            id: manufacturerId,
            label: product.supplier,
            type: 'manufacturer',
            data: { location: product.manufacturing?.country || "Unknown" }
        });
    }
    edges.push({
      id: `edge_prod_mfg_${product.id}`,
      source: manufacturerId,
      target: product.id,
      label: 'manufactured_by',
    });
  }

  // Materials as Component Nodes & link to Suppliers
  if (product.materials && product.materials.length > 0) {
    product.materials.forEach((material, index) => {
        const componentNodeId = `comp_${product.id}_${material.name.replace(/\s+/g, '_')}_${index}`;
        
        nodes.push({
            id: componentNodeId,
            label: material.name,
            type: 'component',
            data: { percentage: material.percentage, origin: material.origin }
        });

        edges.push({
            id: `edge_comp_prod_${componentNodeId}`,
            source: componentNodeId,
            target: product.id,
            label: 'is_part_of'
        });

        // Mock supplier for material
        const supplier = MOCK_SUPPLIERS[index % MOCK_SUPPLIERS.length];
        const supplierNodeId = `sup_${supplier.id}`;

        if (!nodes.find(n => n.id === supplierNodeId)) {
            nodes.push({
                id: supplierNodeId,
                label: supplier.name,
                type: 'supplier',
                data: { location: supplier.location }
            });
        }

        edges.push({
            id: `edge_sup_comp_${supplier.id}_${index}`,
            source: supplierNodeId,
            target: componentNodeId,
            label: 'supplies_item'
        });
    });
  }

  const graphData: GraphData = { nodes, edges };

  return NextResponse.json(graphData);
}


// src/app/api/v1/dpp/graph/[productId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProductById } from '@/lib/actions/product-actions';
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

  // In a real app, you would validate an API key or session here.
  // For now, it's a public endpoint for the demo.

  const product = await getProductById(productId);

  if (!product) {
    return NextResponse.json(
      { error: `Product with ID ${productId} not found.` },
      { status: 404 },
    );
  }

  // Simulate a slight delay
  await new Promise(resolve => setTimeout(resolve, 250));

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  // Helper to add nodes without duplicates
  const addNode = (node: GraphNode) => {
    if (!nodeIds.has(node.id)) {
      nodes.push(node);
      nodeIds.add(node.id);
    }
  };

  // Product Node
  addNode({
    id: product.id,
    label: product.productName,
    type: 'product',
    data: { category: product.category, gtin: product.gtin },
  });

  // Manufacturer Node & Edge
  if (product.supplier) {
    const manufacturerId = `mfg_${product.supplier.replace(/\s+/g, '_')}`;
    addNode({
      id: manufacturerId,
      label: product.supplier,
      type: 'manufacturer',
      data: { location: product.manufacturing?.country || 'Unknown' },
    });
    edges.push({
      id: `edge_mfg_prod_${product.id}`,
      source: manufacturerId,
      target: product.id,
      label: 'manufactured_by',
    });
  }

  // Materials as Component Nodes & link to Suppliers
  if (product.materials && product.materials.length > 0) {
    product.materials.forEach((material, index) => {
      const componentNodeId = `comp_${product.id}_${material.name.replace(
        /\s+/g,
        '_',
      )}_${index}`;

      addNode({
        id: componentNodeId,
        label: material.name,
        type: 'component',
        data: {
          percentage: material.percentage,
          origin: material.origin,
        },
      });

      edges.push({
        id: `edge_comp_prod_${componentNodeId}`,
        source: componentNodeId,
        target: product.id,
        label: 'is_part_of',
      });

      // Mock supplier for material
      if (material.origin) {
        const supplier = MOCK_SUPPLIERS.find(s =>
          s.location.includes(material.origin!),
        );
        if (supplier) {
          const supplierNodeId = `sup_${supplier.id}`;
          addNode({
            id: supplierNodeId,
            label: supplier.name,
            type: 'supplier',
            data: { location: supplier.location },
          });

          edges.push({
            id: `edge_sup_comp_${supplier.id}_${index}`,
            source: supplierNodeId,
            target: componentNodeId,
            label: 'supplies_item',
          });
        }
      }
    });
  }

  const graphData: GraphData = { nodes, edges };

  return NextResponse.json(graphData);
}

// src/components/product-detail-tabs/supply-chain-tab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Building,
  Users,
  Component,
  Loader2,
  Share2,
  ListOrdered,
  MapPin,
  Calendar,
} from 'lucide-react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { format } from 'date-fns';

interface GraphNode {
  id: string;
  label: string;
  type: 'product' | 'manufacturer' | 'supplier' | 'component';
  data?: Record<string, any>;
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

interface SupplyChainTabProps {
  product: Product;
}

const typeIcons = {
  product: Package,
  manufacturer: Building,
  component: Component,
  supplier: Users,
};

const NodeCard = ({
  node,
  children,
  level = 0,
}: {
  node: GraphNode;
  children?: React.ReactNode;
  level?: number;
}) => {
  const Icon = typeIcons[node.type];
  return (
    <div style={{ marginLeft: `${level * 1.5}rem` }}>
      <div className="flex items-center gap-3 p-3 my-2 border rounded-lg bg-muted/50">
        <Icon className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="font-semibold">{node.label}</p>
          <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
          {node.data?.origin && (
            <p className="text-xs text-muted-foreground">
              Origin: {node.data.origin}
            </p>
          )}
          {node.data?.location && (
            <p className="text-xs text-muted-foreground">
              Location: {node.data.location}
            </p>
          )}
        </div>
      </div>
      {children && <div className="pl-4 border-l-2 ml-4">{children}</div>}
    </div>
  );
};

export default function SupplyChainTab({ product }: SupplyChainTabProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/dpp/graph/${product.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch supply chain data.');
        }
        const data: GraphData = await response.json();
        setGraphData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [product.id]);

  const renderTree = (nodeId: string, level = 0) => {
    if (!graphData) return null;
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const childrenEdges = graphData.edges.filter(
      edge => edge.target === nodeId,
    );
    const childrenNodes = childrenEdges
      .map(edge => graphData.nodes.find(n => n.id === edge.source))
      .filter(Boolean) as GraphNode[];

    return (
      <NodeCard key={node.id} node={node} level={level}>
        {childrenNodes.map(childNode => renderTree(childNode.id, level + 1))}
      </NodeCard>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const productNode = graphData?.nodes.find(n => n.type === 'product');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 /> Supply Chain Provenance Graph
          </CardTitle>
          <CardDescription>A hierarchical view of the product's supply chain, from suppliers to components.</CardDescription>
        </CardHeader>
        <CardContent>
          {productNode ? (
            renderTree(productNode.id)
          ) : (
            <p>No supply chain data available.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ListOrdered /> Chain of Custody
            </CardTitle>
            <CardDescription>A chronological log of the product's physical journey and ownership.</CardDescription>
        </CardHeader>
        <CardContent>
        {product.chainOfCustody && product.chainOfCustody.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-[29px] top-0 h-full w-px bg-border -translate-x-1/2" />
            {product.chainOfCustody.map((step, index) => (
              <div
                key={index}
                className="relative mb-6 flex items-start pl-8"
              >
                <div className="absolute left-0 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground -translate-x-1/2">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{step.event}</p>
                  <p className="text-sm text-muted-foreground">
                    by {step.actor} at {step.location}
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-1 flex items-center gap-1"
                    suppressHydrationWarning
                  >
                    <Calendar className="h-3 w-3" />
                    {format(new Date(step.date), 'PPP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            No custody events have been logged for this product.
          </p>
        )}
        </CardContent>
      </Card>
    </div>
  );
}

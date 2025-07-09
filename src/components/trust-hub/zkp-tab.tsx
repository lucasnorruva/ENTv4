// src/components/trust-hub/zkp-tab.tsx
'use client';

import React, { useState, useTransition, useCallback } from 'react';
import type { Product, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateZkProofForProduct, verifyZkProofForProduct } from '@/lib/actions';

interface ZkpTabProps {
  initialProducts: Product[];
  user: User;
  onDataChange: () => void;
}

export default function ZkpTab({ initialProducts, user, onDataChange }: ZkpTabProps) {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateProof = useCallback((productId: string) => {
    setProcessingId(productId);
    startTransition(async () => {
      try {
        await generateZkProofForProduct(productId, user.id);
        toast({ title: 'ZK Proof Generated' });
        onDataChange();
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } finally {
        setProcessingId(null);
      }
    });
  }, [onDataChange, startTransition, toast, user.id]);

  const handleVerifyProof = useCallback((productId: string) => {
    setProcessingId(productId);
    startTransition(async () => {
        try {
            await verifyZkProofForProduct(productId, user.id);
            toast({ title: 'ZK Proof Verified', description: "The proof has been successfully verified." });
            onDataChange();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setProcessingId(null);
        }
    });
  }, [onDataChange, startTransition, toast, user.id]);

  const productsWithProofs = initialProducts.filter(p => p.verificationStatus === 'Verified');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zero-Knowledge Proofs</CardTitle>
        <CardDescription>Generate and verify privacy-preserving ZKPs for compliant products. These proofs can attest to compliance without revealing underlying sensitive data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>ZK Proof Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsWithProofs.map(product => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.productName}</TableCell>
                <TableCell>
                  {product.zkProof ? (
                    <Badge variant={product.zkProof.isVerified ? 'default' : 'secondary'}>
                      {product.zkProof.isVerified ? <ShieldCheck className="h-3 w-3 mr-1"/> : <ShieldQuestion className="h-3 w-3 mr-1"/>}
                      {product.zkProof.isVerified ? 'Verified' : 'Generated'}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Generated</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                   {product.zkProof && !product.zkProof.isVerified && (
                     <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleVerifyProof(product.id)}
                        disabled={isPending && processingId === product.id}
                      >
                         {isPending && processingId === product.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}
                         Verify Proof
                      </Button>
                   )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateProof(product.id)}
                    disabled={isPending && processingId === product.id}
                  >
                    {isPending && processingId === product.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                    {product.zkProof ? 'Regenerate Proof' : 'Generate Proof'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
             {productsWithProofs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">No verified products found to generate proofs for.</TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

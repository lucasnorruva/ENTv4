// src/components/product-detail-tabs/digital-credentials-tab.tsx
'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import {
  Fingerprint,
  Link as LinkIcon,
  FileJson,
  ShieldCheck,
  ShieldQuestion,
  Bot,
  Loader2,
  Key,
} from 'lucide-react';
import type { Product, User } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { can } from '@/lib/permissions';
import { generateZkProofForProduct } from '@/lib/actions/product-actions';
import { Badge } from '../ui/badge';

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-b-0">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {value && (
          <div className="text-muted-foreground text-sm">{value}</div>
        )}
        {children}
      </div>
    </div>
  );
}

interface DigitalCredentialsTabProps {
  product: Product;
  user: User;
  onUpdate: (updatedProduct: Product) => void;
}

export default function DigitalCredentialsTab({
  product,
  user,
  onUpdate,
}: DigitalCredentialsTabProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateProof = () => {
    startTransition(async () => {
      try {
        const updatedProduct = await generateZkProofForProduct(
          product.id,
          user.id,
        );
        onUpdate(updatedProduct);
        toast({ title: 'ZK Proof Generated' });
      } catch (error: any) {
        toast({
          title: 'Error',
          description:
            error.message || 'Failed to generate Zero-Knowledge Proof.',
          variant: 'destructive',
        });
      }
    });
  };

  const canGenerateProof = can(user, 'product:generate_zkp', product);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>On-Chain Proof</CardTitle>
          <CardDescription>
            Immutable data anchoring and credential verification details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InfoRow icon={Fingerprint} label="Anchoring Method">
            <p className="text-sm text-muted-foreground">
              {product.blockchainProof?.type || 'Not Anchored'}
            </p>
          </InfoRow>
          <InfoRow
            icon={FileJson}
            label="Verifiable Credential (VC)"
            value="W3C Data Integrity Proof (EdDSA)"
          >
            <ScrollArea className="h-48 mt-2 w-full rounded-md border bg-muted p-4">
              <pre className="text-xs break-all whitespace-pre-wrap">
                {product.verifiableCredential
                  ? JSON.stringify(JSON.parse(product.verifiableCredential), null, 2)
                  : 'Not available. Passport must be verified.'}
              </pre>
            </ScrollArea>
          </InfoRow>
          {product.ebsiVcId && (
            <InfoRow
              icon={LinkIcon}
              label="EBSI Credential"
              value={product.ebsiVcId}
            >
              <Button asChild variant="link" size="sm" className="p-0 h-auto">
                <Link
                  href={`https://api.preprod.ebsi.eu/did-registry/v5/dids/${product.ebsiVcId}`}
                  target="_blank"
                >
                  View on EBSI Registry
                </Link>
              </Button>
            </InfoRow>
          )}
          {product.blockchainProof && (
             <InfoRow
              icon={LinkIcon}
              label="Blockchain Transaction"
            >
                <div className="flex items-center gap-4">
                     <Badge variant="outline">{product.blockchainProof.chain}</Badge>
                     <Button asChild variant="link" size="sm" className="p-0 h-auto">
                        <Link href={product.blockchainProof.explorerUrl} target="_blank">
                          {product.blockchainProof.txHash.slice(0, 10)}...{product.blockchainProof.txHash.slice(-8)}
                        </Link>
                      </Button>
                </div>
            </InfoRow>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Zero-Knowledge Proof</CardTitle>
          <CardDescription>
            Generate and verify a ZKP to attest compliance without revealing
            sensitive data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {product.zkProof ? (
            <div>
              <InfoRow
                icon={product.zkProof.isVerified ? ShieldCheck : ShieldQuestion}
                label="Verification Status"
              >
                <span
                  className={
                    product.zkProof.isVerified
                      ? 'text-green-600'
                      : 'text-amber-600'
                  }
                >
                  {product.zkProof.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </InfoRow>
              <InfoRow icon={Key} label="Proof Data">
                <p className="text-xs font-mono break-all text-muted-foreground">
                  {product.zkProof.proofData}
                </p>
              </InfoRow>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No ZK Proof has been generated for this product.
            </div>
          )}
        </CardContent>
        {canGenerateProof && (
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleGenerateProof}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-2 h-4 w-4" />
              )}
              {product.zkProof ? 'Regenerate ZK Proof' : 'Generate ZK Proof'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

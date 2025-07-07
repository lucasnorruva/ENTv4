// src/components/blockchain-product-detail-client.tsx
'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Fingerprint,
  Link as LinkIcon,
  FileJson,
  ShieldCheck,
  ShieldQuestion,
  KeyRound,
  FileText,
  User as UserIcon,
  Bot,
  Loader2,
  Calendar,
  MapPin,
  ListOrdered,
  Send,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';

import type { Product, User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { can } from '@/lib/permissions';
import {
  addCustodyStep,
  transferOwnership,
  generateZkProofForProduct,
  verifyZkProofForProduct,
} from '@/lib/actions/product-actions';
import {
  custodyStepSchema,
  ownershipTransferSchema,
  type CustodyStepFormValues,
  type OwnershipTransferFormValues,
} from '@/lib/schemas';

interface BlockchainProductDetailClientProps {
  product: Product;
  user: User;
}

const InfoCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) => (
  <div className="flex justify-between items-center text-sm py-2 border-b last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-right">{value}</span>
  </div>
);

export default function BlockchainProductDetailClient({
  product: initialProduct,
  user,
}: BlockchainProductDetailClientProps) {
  const [product, setProduct] = useState(initialProduct);
  const [isZkpPending, startZkpTransition] = useTransition();
  const [isCustodyPending, startCustodyTransition] = useTransition();
  const [isTransferPending, startTransferTransition] = useTransition();
  const [isVerifyPending, startVerifyTransition] = useTransition();
  const { toast } = useToast();

  const custodyForm = useForm<CustodyStepFormValues>({
    resolver: zodResolver(custodyStepSchema),
    defaultValues: { event: '', location: '', actor: '' },
  });

  const transferForm = useForm<OwnershipTransferFormValues>({
    resolver: zodResolver(ownershipTransferSchema),
    defaultValues: { newOwnerAddress: '' },
  });

  const handleGenerateProof = () => {
    startZkpTransition(async () => {
      try {
        const updatedProduct = await generateZkProofForProduct(
          product.id,
          user.id,
        );
        setProduct(updatedProduct);
        toast({ title: 'ZK Proof Generated' });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleVerifyProof = () => {
    startVerifyTransition(async () => {
      try {
        const updatedProduct = await verifyZkProofForProduct(product.id, user.id);
        setProduct(updatedProduct);
        toast({ title: 'ZK Proof Verified' });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const onCustodySubmit = (values: CustodyStepFormValues) => {
    startCustodyTransition(async () => {
        try {
            const updatedProduct = await addCustodyStep(product.id, values, user.id);
            setProduct(updatedProduct);
            custodyForm.reset();
            toast({ title: 'Custody Step Added' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };

  const onTransferSubmit = (values: OwnershipTransferFormValues) => {
    startTransferTransition(async () => {
        try {
            const updatedProduct = await transferOwnership(product.id, values, user.id);
            setProduct(updatedProduct);
            transferForm.reset();
            toast({ title: 'Ownership Transferred' });
        } catch(error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/admin/blockchain">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blockchain Management
        </Link>
      </Button>
      <header className="flex items-center gap-4">
        <Image
          src={product.productImage}
          alt={product.productName}
          width={80}
          height={80}
          className="rounded-lg border"
          data-ai-hint="product photo"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {product.productName}
          </h1>
          <p className="text-muted-foreground font-mono text-xs">{product.id}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard
          title="Blockchain & EBSI Details"
          description="Status of on-chain anchoring and credentialing."
        >
          <DetailRow
            label="Anchor Status"
            value={
              <Badge variant={product.blockchainProof ? 'default' : 'secondary'}>
                {product.blockchainProof ? 'Anchored' : 'Not Anchored'}
              </Badge>
            }
          />
          <DetailRow
            label="VC Status"
            value={
              <Badge variant={product.verifiableCredential ? 'default' : 'secondary'}>
                {product.verifiableCredential ? 'Issued' : 'Not Issued'}
              </Badge>
            }
          />
          <DetailRow
            label="EBSI Conformance"
            value={
              <Badge variant={product.ebsiDetails?.status === 'Verified' ? 'default' : 'secondary'}>
                {product.ebsiDetails?.status || 'Pending'}
              </Badge>
            }
          />
        </InfoCard>

        <InfoCard
          title="Zero-Knowledge Proof"
          description="Privacy-preserving compliance verification."
        >
          <DetailRow
            label="ZK Proof Status"
            value={
              <Badge variant={product.zkProof ? 'default' : 'secondary'}>
                {product.zkProof ? (product.zkProof.isVerified ? 'Verified' : 'Generated') : 'Not Generated'}
              </Badge>
            }
          />
          <div className="mt-4 flex gap-2">
            {can(user, 'product:generate_zkp', product) && (
              <Button onClick={handleGenerateProof} disabled={isZkpPending} className="w-full">
                {isZkpPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                {product.zkProof ? 'Regenerate Proof' : 'Generate Proof'}
              </Button>
            )}
            {product.zkProof && !product.zkProof.isVerified && (
               <Button onClick={handleVerifyProof} disabled={isVerifyPending} variant="secondary" className="w-full">
                {isVerifyPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Verify Proof
              </Button>
            )}
          </div>
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard
          title="Chain of Custody"
          description="Log of physical or digital handovers."
        >
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {product.chainOfCustody?.map((step, i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="bg-primary/20 rounded-full p-2 text-primary">
                            <ListOrdered className="h-5 w-5"/>
                        </div>
                        {i < product.chainOfCustody!.length - 1 && <div className="w-px h-full bg-border"></div>}
                    </div>
                    <div>
                        <p className="font-semibold">{step.event}</p>
                        <p className="text-xs text-muted-foreground"><UserIcon className="inline h-3 w-3 mr-1"/>{step.actor}</p>
                        <p className="text-xs text-muted-foreground"><MapPin className="inline h-3 w-3 mr-1"/>{step.location}</p>
                        <p className="text-xs text-muted-foreground"><Calendar className="inline h-3 w-3 mr-1"/>{format(new Date(step.date), 'PP')}</p>
                    </div>
                </div>
            ))}
            {(!product.chainOfCustody || product.chainOfCustody.length === 0) && <p className="text-center text-sm text-muted-foreground py-4">No custody events logged.</p>}
          </div>
          <Form {...custodyForm}>
            <form onSubmit={custodyForm.handleSubmit(onCustodySubmit)} className="space-y-4 mt-4 border-t pt-4">
              <FormField name="event" control={custodyForm.control} render={({field}) => (<FormItem><FormLabel>Event Description</FormLabel><FormControl><Input {...field} placeholder="e.g., Transfer to warehouse"/></FormControl><FormMessage/></FormItem>)}/>
              <div className="grid grid-cols-2 gap-4">
                <FormField name="location" control={custodyForm.control} render={({field}) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} placeholder="e.g., Hamburg, DE"/></FormControl><FormMessage/></FormItem>)}/>
                <FormField name="actor" control={custodyForm.control} render={({field}) => (<FormItem><FormLabel>Actor</FormLabel><FormControl><Input {...field} placeholder="e.g., DHL Logistics"/></FormControl><FormMessage/></FormItem>)}/>
              </div>
              <Button type="submit" disabled={isCustodyPending} className="w-full">
                {isCustodyPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                Add Custody Step
              </Button>
            </form>
          </Form>
        </InfoCard>

         <InfoCard
          title="Ownership Transfer (NFT)"
          description="Transfer the digital ownership token for this product."
        >
          <DetailRow label="Token ID" value={<span className="font-mono text-xs">{product.ownershipNft?.tokenId || 'N/A'}</span>}/>
          <DetailRow label="Contract Address" value={<span className="font-mono text-xs">{product.ownershipNft?.contractAddress || 'N/A'}</span>}/>
          <DetailRow label="Current Owner" value={<span className="font-mono text-xs">{product.ownershipNft?.ownerAddress || 'N/A'}</span>}/>
          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4 mt-4 border-t pt-4">
               <FormField name="newOwnerAddress" control={transferForm.control} render={({field}) => (<FormItem><FormLabel>New Owner Address</FormLabel><FormControl><Input {...field} placeholder="0x... new owner wallet address"/></FormControl><FormMessage/></FormItem>)}/>
               <Button type="submit" disabled={isTransferPending || !product.ownershipNft} className="w-full">
                {isTransferPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />}
                Transfer Ownership
              </Button>
            </form>
          </Form>
        </InfoCard>
      </div>
    </div>
  );
}

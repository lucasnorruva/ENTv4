// src/components/product-detail-tabs/compliance-tab.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  AlertTriangle,
  Fingerprint,
  FileQuestion,
  Link as LinkIcon,
  ShieldCheck,
  Copyright,
  Utensils,
  Recycle,
  Leaf,
} from 'lucide-react';
import type { Product, CompliancePath } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
          {value && <div className="text-muted-foreground text-sm">{value}</div>}
          {children}
        </div>
      </div>
    );
  }

interface ComplianceTabProps {
    product: Product;
    compliancePath?: CompliancePath;
}

export default function ComplianceTab({ product, compliancePath }: ComplianceTabProps) {
    const { sustainability } = product;

    return (
        <Card>
            <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>
                Verification against selected compliance paths and
                regulations.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {sustainability?.gaps &&
                sustainability.gaps.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                    Potential Compliance Gaps Detected
                    </AlertTitle>
                    <AlertDescription>
                    <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                        {sustainability.gaps.map((gap, index) => (
                        <li key={index}>
                            <strong>{gap.regulation}:</strong> {gap.issue}
                        </li>
                        ))}
                    </ul>
                    </AlertDescription>
                </Alert>
                )}
            {compliancePath ? (
                <InfoRow icon={FileQuestion} label="Compliance Path">
                <p className="font-semibold text-foreground">
                    {compliancePath.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    {compliancePath.description}
                </p>
                <Accordion
                    type="single"
                    collapsible
                    className="w-full mt-2"
                >
                    <AccordionItem value="rules">
                    <AccordionTrigger className="text-xs">
                        View Path Rules (JSON)
                    </AccordionTrigger>
                    <AccordionContent>
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(compliancePath.rules, null, 2)}
                        </pre>
                    </AccordionContent>
                    </AccordionItem>
                </Accordion>
                </InfoRow>
            ) : (
                <InfoRow
                icon={FileQuestion}
                label="Compliance Path"
                value={'None selected'}
                />
            )}

            {product.declarationOfConformity && (
                <InfoRow
                icon={FileText}
                label="Generated Declaration of Conformity"
                >
                <Card className="mt-2 bg-muted/50">
                    <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none text-xs">
                    <ReactMarkdown>
                        {product.declarationOfConformity}
                    </ReactMarkdown>
                    </CardContent>
                </Card>
                </InfoRow>
            )}

            <Accordion
                type="single"
                collapsible
                defaultValue="declarations"
                className="w-full mt-4"
            >
                <AccordionItem value="declarations">
                <AccordionTrigger>Declarations</AccordionTrigger>
                <AccordionContent>
                    <InfoRow icon={ShieldCheck} label="RoHS Compliant">
                    <div className="text-sm text-muted-foreground">
                        {product.compliance?.rohsCompliant ? 'Yes' : 'No'}
                        {product.compliance?.rohsExemption && (
                        <span className="ml-2 text-xs">
                            (Exemption:{' '}
                            {product.compliance.rohsExemption})
                        </span>
                        )}
                    </div>
                    </InfoRow>
                    <InfoRow icon={Copyright} label="CE Marked">
                    <div className="text-sm text-muted-foreground">
                        {product.compliance?.ceMarked ? 'Yes' : 'No'}
                    </div>
                    </InfoRow>
                    <InfoRow icon={Utensils} label="Food Contact Safe">
                    <div className="text-sm text-muted-foreground">
                        {product.compliance?.foodContactSafe
                        ? 'Yes'
                        : 'No'}
                        {product.compliance
                        ?.foodContactComplianceStandard && (
                        <span className="ml-2 text-xs">
                            (Standard:{' '}
                            {
                            product.compliance
                                .foodContactComplianceStandard
                            }
                            )
                        </span>
                        )}
                    </div>
                    </InfoRow>
                    <InfoRow
                    icon={AlertTriangle}
                    label="Prop 65 Warning"
                    >
                    <div className="text-sm text-muted-foreground">
                        {product.compliance?.prop65WarningRequired
                        ? 'Required'
                        : 'Not Required'}
                    </div>
                    </InfoRow>
                    <InfoRow icon={Recycle} label="WEEE Compliance">
                    <div className="text-sm text-muted-foreground">
                        Registered:{' '}
                        {product.compliance?.weeeRegistered
                        ? 'Yes'
                        : 'No'}
                        {product.compliance
                        ?.weeeRegistrationNumber && (
                        <span className="ml-2 font-mono text-xs">
                            (
                            {
                            product.compliance
                                .weeeRegistrationNumber
                            }
                            )
                        </span>
                        )}
                    </div>
                    </InfoRow>
                    <InfoRow icon={Leaf} label="EUDR Compliant">
                    <div className="text-sm text-muted-foreground">
                        {product.compliance?.eudrCompliant
                        ? 'Yes'
                        : 'No'}
                        {product.compliance?.eudrDiligenceId && (
                        <span className="ml-2 text-xs">
                            (Diligence ID:{' '}
                            {product.compliance.eudrDiligenceId})
                        </span>
                        )}
                    </div>
                    </InfoRow>
                    <InfoRow icon={FileText} label="SCIP Reference">
                    <div className="font-mono text-xs text-muted-foreground">
                        {product.compliance?.scipReference ||
                        'Not Provided'}
                    </div>
                    </InfoRow>
                </AccordionContent>
                </AccordionItem>
            </Accordion>

            <InfoRow icon={FileText} label="Certifications">
                {product.certifications &&
                product.certifications.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {product.certifications.map(
                    (cert: any, index: number) => (
                        <li key={index}>
                        {cert.name} (by {cert.issuer})
                        </li>
                    ),
                    )}
                </ul>
                ) : (
                <p className="text-muted-foreground">
                    No certifications listed.
                </p>
                )}
            </InfoRow>
            {product.blockchainProof && (
                <InfoRow icon={Fingerprint} label="On-Chain Proof">
                <Link
                    href={product.blockchainProof.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                    View Transaction
                    <LinkIcon className="h-3 w-3" />
                </Link>
                </InfoRow>
            )}
            </CardContent>
        </Card>
    )
}
// src/components/product-detail-tabs/circularity-tab.tsx
'use client';

import { Award, BookCheck, Hash, FileText } from 'lucide-react';
import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from '@/components/ui/accordion';
import ReactMarkdown from 'react-markdown';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-b-0">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {value && <div className="text-muted-foreground text-sm">{value}</div>}
      </div>
    </div>
  );
}

interface CircularityTabProps {
  product: Product;
}

export default function CircularityTab({ product }: CircularityTabProps) {
  const { massBalance, sustainabilityDeclaration } = product;

  if (!massBalance && !sustainabilityDeclaration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Circularity & Mass Balance</CardTitle>
          <CardDescription>
            Information about the product's circularity claims and certifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            No circularity information has been provided for this product.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
        {massBalance && (
            <Card>
            <CardHeader>
                <CardTitle>Mass Balance Details</CardTitle>
                <CardDescription>
                Data related to ISCC PLUS, REDcert-EU, or other mass balance schemes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <InfoRow
                icon={Award}
                label="Circularity Credits Allocated"
                value={massBalance.creditsAllocated ? `${massBalance.creditsAllocated} Credits` : 'None'}
                />
                <InfoRow
                icon={BookCheck}
                label="Certification Body"
                value={massBalance.certificationBody || 'Not specified'}
                />
                <InfoRow
                icon={Hash}
                label="Certificate Number"
                value={<span className="font-mono text-xs">{massBalance.certificateNumber || 'Not specified'}</span>}
                />
            </CardContent>
            </Card>
        )}

        {sustainabilityDeclaration && (
            <Card>
                <CardHeader>
                    <CardTitle>Sustainability Declaration</CardTitle>
                </CardHeader>
                <CardContent>
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="sustainability-declaration">
                            <AccordionTrigger>
                                <h4 className="flex items-center gap-2 font-semibold">
                                <FileText />
                                View Generated Declaration
                                </h4>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted p-4">
                                <ReactMarkdown>
                                    {sustainabilityDeclaration}
                                </ReactMarkdown>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                     </Accordion>
                </CardContent>
            </Card>
        )}
    </div>
  );
}

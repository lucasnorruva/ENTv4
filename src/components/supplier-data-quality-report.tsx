// src/components/supplier-data-quality-report.tsx
'use client';

import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface SupplierDataQualityReportProps {
  products: Product[];
}

export default function SupplierDataQualityReport({ products }: SupplierDataQualityReportProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality Report</CardTitle>
        <CardDescription>
          Review AI-detected potential issues in your product data to improve passport accuracy and compliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {products.map(product => (
              <AccordionItem value={product.id} key={product.id}>
                <AccordionTrigger>
                    <div className="flex items-center gap-4 text-left">
                        <Image
                            src={product.productImage}
                            alt={product.productName}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                            data-ai-hint="product photo"
                        />
                        <div>
                            <p className="font-semibold">{product.productName}</p>
                            <p className="text-sm text-muted-foreground">{product.dataQualityWarnings?.length} warning(s)</p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-4 border-l-2 ml-6 space-y-2 py-2">
                    {product.dataQualityWarnings?.map((warning, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 mt-1 text-amber-500 shrink-0" />
                        <div>
                          <p className="font-semibold">{warning.field}</p>
                          <p className="text-muted-foreground">{warning.warning}</p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                        <Button asChild variant="secondary" size="sm">
                           <Link href={`/dashboard/supplier/products`}>
                                Edit Product <ArrowRight className="ml-2 h-4 w-4" />
                           </Link>
                        </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-lg font-semibold">No data quality issues found!</p>
            <p>All your submitted product data looks great.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

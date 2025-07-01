// src/components/dpp-completeness-widget.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Product } from '@/types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const fieldsToTrack = [
  { key: 'productName', label: 'Product Name', section: 'General' },
  { key: 'productDescription', label: 'Description', section: 'General' },
  { key: 'category', label: 'Category', section: 'General' },
  { key: 'materials', label: 'Materials', section: 'Data' },
  { key: 'manufacturing.country', label: 'Manufacturing Country', section: 'Data' },
  { key: 'packaging.type', label: 'Packaging Type', section: 'Packaging' },
  { key: 'compliancePathId', label: 'Compliance Path', section: 'Compliance' },
  { key: 'sustainability.score', label: 'ESG Score', section: 'Sustainability'},
];

const calculateCompleteness = (product: Product) => {
  let completedFields = 0;
  const totalFields = fieldsToTrack.length;
  const sections: Record<string, { completed: number, total: number, fields: {label: string, isComplete: boolean}[] }> = {};

  fieldsToTrack.forEach(field => {
    // a helper to get nested properties
    const get = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);
    const value = get(product, field.key);
    
    const isComplete = Array.isArray(value) ? value.length > 0 : !!value;
    
    if (isComplete) {
      completedFields++;
    }

    if (!sections[field.section]) {
        sections[field.section] = { completed: 0, total: 0, fields: [] };
    }
    sections[field.section].total++;
    sections[field.section].fields.push({ label: field.label, isComplete });
    if(isComplete) {
        sections[field.section].completed++;
    }
  });

  const overallPercentage = Math.round((completedFields / totalFields) * 100);

  return { overallPercentage, completedFields, totalFields, sections };
};

export default function DppCompletenessWidget({ product }: { product: Product }) {
  const { overallPercentage, completedFields, totalFields, sections } = calculateCompleteness(product);

  return (
    <Card>
      <CardHeader>
        <CardTitle>DPP Data Completeness</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold">Overall: {overallPercentage}%</span>
          <span className="text-sm text-muted-foreground">{completedFields} / {totalFields} fields</span>
        </div>
        <Progress value={overallPercentage} className="mb-4" />
        <Accordion type="single" collapsible>
          <AccordionItem value="details">
            <AccordionTrigger>View Section Details</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {Object.entries(sections).map(([name, data]) => (
                   <div key={name}>
                       <p className="font-semibold text-sm">{name} ({data.completed}/{data.total})</p>
                       <ul className="pl-4 mt-1 space-y-1">
                           {data.fields.map(field => (
                               <li key={field.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                                   {field.isComplete ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-amber-500" />}
                                   <span>{field.label}</span>
                               </li>
                           ))}
                       </ul>
                   </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

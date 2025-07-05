// src/components/submission-checklist.tsx
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
import type { SubmissionChecklist } from '@/types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SubmissionChecklistProps {
  checklist: SubmissionChecklist;
}

const checklistItems = [
  { key: 'hasBaseInfo', label: 'Base Product Information' },
  { key: 'hasMaterials', label: 'Material Composition' },
  { key: 'hasManufacturing', label: 'Manufacturing Details' },
  { key: 'hasLifecycleData', label: 'Lifecycle & Repairability Data' },
  { key: 'hasCompliancePath', label: 'Compliance Path Assigned' },
  { key: 'passesDataQuality', label: 'Passes AI Data Quality Check' },
];

export default function SubmissionChecklist({
  checklist,
}: SubmissionChecklistProps) {
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = checklistItems.length;
  const overallPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Readiness</CardTitle>
        <CardDescription>
          The following checks must pass before this passport can be submitted
          for review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold">
            Overall Progress: {overallPercentage}%
          </span>
          <span className="text-sm text-muted-foreground">
            {completedCount} / {totalCount} checks passed
          </span>
        </div>
        <Progress value={overallPercentage} className="mb-4" />
        <Accordion type="single" collapsible>
          <AccordionItem value="details" className="border-none">
            <AccordionTrigger className="text-sm p-0 hover:no-underline">
              View Checklist Details
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-2">
                {checklistItems.map(item => (
                  <div
                    key={item.key}
                    className="flex items-center gap-2 text-sm"
                  >
                    {checklist[item.key as keyof SubmissionChecklist] ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span>{item.label}</span>
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


// src/components/ai-workbench/supplier-scorer.tsx
'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Loader2, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

// Mocked result for demonstration
interface ScoreResult {
  overallScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  redFlags: string[];
  strengths: string[];
}

const getRiskVariant = (riskLevel: ScoreResult['riskLevel']) => {
  switch (riskLevel) {
    case 'Low':
      return 'default';
    case 'Medium':
      return 'secondary';
    case 'High':
    case 'Critical':
      return 'destructive';
  }
};

export default function SupplierScorer({ user }: { user: User }) {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  const handleScoreSupplier = () => {
    if (!url.trim()) {
      toast({ title: 'URL required', description: "Please enter a supplier's website URL.", variant: 'destructive'});
      return;
    }
    setIsPending(true);
    setResult(null);

    // Simulate AI analysis and external data fetching
    setTimeout(() => {
      // Mock result based on URL content for demonstration
      const score = 50 + Math.floor(Math.random() * 45);
      const mockResult: ScoreResult = {
        overallScore: score,
        riskLevel: score > 80 ? 'Low' : score > 60 ? 'Medium' : 'High',
        redFlags: score < 70 ? ['No public statement on conflict minerals.', 'Limited transparency on waste management.'] : [],
        strengths: score > 75 ? ['Clear sustainability report available.', 'Member of the Responsible Business Alliance.'] : ['Basic environmental policy published.'],
      };
      setResult(mockResult);
      setIsPending(false);
      toast({ title: 'Analysis Complete', description: `Scored supplier at ${url}.` });
    }, 2500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target /> Instant Supplier Compliance Scoring
        </CardTitle>
        <CardDescription>
          Paste a supplier's website URL to get an AI-generated compliance and
          risk score based on publicly available data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://supplier-website.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={handleScoreSupplier} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ClipboardCheck className="mr-2 h-4 w-4" />
            )}
            Score
          </Button>
        </div>
        <div className="min-h-[160px] pt-4">
            {isPending ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Scoring supplier...</p>
                </div>
            ) : result ? (
                <Alert>
                    <div className="flex justify-between items-center mb-2">
                        <AlertTitle>Compliance Score</AlertTitle>
                        <Badge variant={getRiskVariant(result.riskLevel)} className="text-lg">{result.overallScore}</Badge>
                    </div>
                    <AlertDescription className="space-y-3">
                         <div>
                            <p className="font-semibold text-foreground">Risk Level: {result.riskLevel}</p>
                         </div>
                         <div>
                            <p className="font-semibold text-foreground">Strengths:</p>
                            <ul className="list-disc list-inside text-xs">
                                {result.strengths.map((s,i) => <li key={i}>{s}</li>)}
                            </ul>
                         </div>
                         <div>
                            <p className="font-semibold text-destructive">Red Flags:</p>
                            <ul className="list-disc list-inside text-xs">
                                {result.redFlags.length > 0 ? result.redFlags.map((r,i) => <li key={i}>{r}</li>) : <li>None detected.</li>}
                            </ul>
                         </div>
                    </AlertDescription>
                </Alert>
            ) : (
                 <div className="text-center text-muted-foreground pt-8">
                    Enter a URL to score a supplier.
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

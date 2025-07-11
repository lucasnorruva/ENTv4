// src/components/ai-workbench/news-analyzer.tsx
'use client';

import React, { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  BrainCircuit,
  Loader2,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runNewsAnalysis } from '@/lib/actions/ai';
import type { User } from '@/types';
import type { AnalyzeNewsOutput } from '@/types/ai-outputs';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';

const SentimentBadge = ({
  sentiment,
}: {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}) => {
  const variants = {
    Positive: {
      variant: 'default',
      className:
        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
      icon: TrendingUp,
      label: 'Positive',
    },
    Neutral: {
      variant: 'secondary',
      className: '',
      icon: Minus,
      label: 'Neutral',
    },
    Negative: {
      variant: 'destructive',
      className:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
      icon: TrendingDown,
      label: 'Negative',
    },
  } as const;

  const current = variants[sentiment];
  const Icon = current.icon;

  return (
    <Badge variant={current.variant} className={current.className}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {current.label}
    </Badge>
  );
};

export default function NewsAnalyzer({ user }: { user: User }) {
  const [result, setResult] = useState<AnalyzeNewsOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const [topic, setTopic] = useState('PFAS regulations');
  const { toast } = useToast();

  const handleRunAnalysis = () => {
    if (!topic.trim()) {
      toast({
        title: 'No topic provided',
        description: 'Please enter a topic to search for news.',
        variant: 'destructive',
      });
      return;
    }
    setResult(null);
    startTransition(async () => {
      try {
        const analysisResult = await runNewsAnalysis(topic, user.id);
        setResult(analysisResult);
        toast({
          title: 'Analysis Complete',
          description:
            'The news articles have been analyzed for regulatory signals.',
        });
      } catch (error: any) {
        toast({
          title: 'Analysis Failed',
          description: error.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper /> Regulatory News Analyzer
        </CardTitle>
        <CardDescription>
          Enter a topic (e.g., "PFAS regulations", "microplastics in textiles").
          The AI will search for recent news and analyze it for potential
          regulatory signals.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="news-topic">Topic</Label>
            <Input
              id="news-topic"
              placeholder="Enter a regulatory topic..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
          <Button
            onClick={handleRunAnalysis}
            disabled={isPending || !topic.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze News
          </Button>
        </div>
        <div className="min-h-[200px] rounded-md border bg-muted/50 p-4">
          {isPending ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Analyzing signals...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">AI Analysis Result</h4>
                <SentimentBadge sentiment={result.sentiment} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Key Takeaways:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {result.keyTakeaways.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
              <BrainCircuit className="h-8 w-8 mb-2" />
              <p>Analysis results will appear here.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

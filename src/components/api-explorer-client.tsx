// src/components/api-explorer-client.tsx
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getApiKeys } from '@/lib/actions/api-key-actions';
import { type User } from '@/types';
import { Play, Loader2 } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-graphql';
import 'prismjs/themes/prism-tomorrow.css';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { sampleQueries } from '@/lib/graphql-queries';

// This is a simplified GraphQL client for the explorer.
async function queryApi(query: string, variables: string, apiKey: string) {
  let parsedVariables;
  try {
    parsedVariables = variables ? JSON.parse(variables) : {};
  } catch (e) {
 throw new Error('Invalid JSON in variables: ' + (e as Error).message);
  }

  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      variables: parsedVariables,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API Error: ${response.status} ${response.statusText} - ${errorBody}`,
    );
  }

  return response.json();
}

export default function ApiExplorerClient({ user }: { user: User }) {
  const [query, setQuery] = useState(sampleQueries[0].query);
  const [variables, setVariables] = useState(
    sampleQueries[0].variables || '{}',
  );
  const [response, setResponse] = useState('');
  const [isPending, startTransition] = useTransition();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { toast } = useToast();

  const editorStyle = {
    fontFamily: '"Fira code", "Fira Mono", monospace',
    fontSize: 14,
    minHeight: '100%',
    backgroundColor: 'hsl(var(--muted))',
    color: 'hsl(var(--foreground))',
    borderRadius: 'var(--radius)',
  };

  const fetchKey = useCallback(async () => {
    try {
      const keys = await getApiKeys(user.id);
      const activeKey = keys.find(k => k.status === 'Active' && k.rawToken);
      if (activeKey?.rawToken) {
        setApiKey(activeKey.rawToken);
      } else {
        toast({
          title: 'No Active API Key',
          description:
            'Please create an active API key in the "API Keys" tab to use the explorer.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Could not fetch API keys.',
        variant: 'destructive',
      });
    }
  }, [user.id, toast]);

  useEffect(() => {
    if (user?.id) {
      fetchKey();
    }
  }, [user?.id, fetchKey]);

  const handleRunQuery = useCallback(() => {
    if (!apiKey) {
      toast({
        title: 'API Key Missing',
        description: 'Cannot run query without an active API key.',
        variant: 'destructive',
      });
      return;
    }
    setResponse('');
    startTransition(async () => {
      try {
        const result = await queryApi(query, variables, apiKey);
        setResponse(JSON.stringify(result, null, 2));
      } catch (error: any) {
        setResponse(JSON.stringify({ error: error.message }, null, 2));
      }
    });
  }, [apiKey, query, variables, toast]);

  const handleSampleQueryChange = useCallback((queryName: string) => {
    const selected = sampleQueries.find(q => q.name === queryName);
    if (selected) {
      setQuery(selected.query);
      setVariables(selected.variables || '{}');
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>GraphQL Query</CardTitle>
          <CardDescription>
            Write and execute GraphQL queries or select a sample query to get
            started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <div>
            <label
              htmlFor="sample-query"
              className="text-sm font-medium mb-2 block"
            >
              Sample Queries
            </label>
            <Select onValueChange={handleSampleQueryChange}>
              <SelectTrigger id="sample-query">
                <SelectValue placeholder="Select a sample query..." />
              </SelectTrigger>
              <SelectContent>
                {sampleQueries.map(q => (
                  <SelectItem key={q.name} value={q.name}>
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 flex flex-col">
            <label htmlFor="query" className="text-sm font-medium mb-2">
              Query
            </label>
            <div className="p-2 rounded-md bg-muted/50 border flex-1 h-64 overflow-auto">
              <Editor
                value={query}
                onValueChange={code => setQuery(code)}
                highlight={code =>
                  highlight(code, languages.graphql, 'graphql')
                }
                padding={10}
                style={editorStyle}
                className="h-full"
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <label htmlFor="variables" className="text-sm font-medium mb-2">
              Variables (JSON)
            </label>
            <div className="p-2 rounded-md bg-muted/50 border h-32 overflow-auto">
              <Editor
                value={variables}
                onValueChange={code => setVariables(code)}
                highlight={code => highlight(code, languages.json, 'json')}
                padding={10}
                style={editorStyle}
              />
            </div>
          </div>
          <Button onClick={handleRunQuery} disabled={isPending || !apiKey}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Query
          </Button>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Response</CardTitle>
          <CardDescription>
            The result of your GraphQL query will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 h-full">
          <div className="bg-muted rounded-md h-full p-2 border overflow-auto">
            <Editor
              readOnly
              value={
                response ? response : 'Click "Run Query" to see the response.'
              }
              onValueChange={() => {}} // no-op
              highlight={code => highlight(code, languages.json, 'json')}
              padding={10}
              style={editorStyle}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

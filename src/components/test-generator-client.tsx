'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateComponentTest } from '@/lib/actions';
import type { User } from '@/types';
import { Beaker, Loader2, Copy, Check } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TestGeneratorClientProps {
  user: User;
}

export default function TestGeneratorClient({ user }: TestGeneratorClientProps) {
  const [componentName, setComponentName] = useState('');
  const [componentCode, setComponentCode] = useState('');
  const [generatedTestCode, setGeneratedTestCode] = useState('');
  const [isPending, startTransition] = useTransition();
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!componentName.trim() || !componentCode.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please provide both a component name and its source code.',
        variant: 'destructive',
      });
      return;
    }
    startTransition(async () => {
      try {
        const result = await generateComponentTest(componentName, componentCode, user.id);
        setGeneratedTestCode(result.testCode);
        toast({ title: 'Test generated successfully!' });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const copyToClipboard = () => {
    if (generatedTestCode) {
      navigator.clipboard.writeText(generatedTestCode);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const editorStyle = {
    fontFamily: '"Fira code", "Fira Mono", monospace',
    fontSize: 14,
    minHeight: '100%',
    backgroundColor: 'hsl(var(--muted))',
    color: 'hsl(var(--foreground))',
    borderRadius: 'var(--radius)',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Test Generator</CardTitle>
          <CardDescription>
            Paste your React component code to automatically generate a Jest/React Testing Library test file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="component-name">Component Name</Label>
                <Input
                  id="component-name"
                  placeholder="e.g., MyButton"
                  value={componentName}
                  onChange={e => setComponentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="component-code">Component Source Code</Label>
                <Textarea
                  id="component-code"
                  placeholder="Paste your component code here..."
                  value={componentCode}
                  onChange={e => setComponentCode(e.target.value)}
                  className="min-h-[300px] font-mono text-xs"
                />
              </div>
              <Button onClick={handleGenerate} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Beaker className="mr-2 h-4 w-4" />
                )}
                Generate Test
              </Button>
            </div>
            <div className="space-y-2 relative">
              <Label>Generated Test Code</Label>
              <div className="rounded-md border h-[420px] overflow-auto bg-muted">
                 <Editor
                    readOnly
                    value={generatedTestCode || '// Your generated test will appear here...'}
                    onValueChange={() => {}}
                    highlight={code => highlight(code, languages.javascript, 'javascript')}
                    padding={10}
                    style={editorStyle}
                />
              </div>
              {generatedTestCode && (
                 <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-8 h-8 w-8"
                    onClick={copyToClipboard}
                  >
                    {hasCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

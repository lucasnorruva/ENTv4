'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-solidity';
import 'prismjs/themes/prism-tomorrow.css';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check } from 'lucide-react';

interface GeneratedContractDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  code: string | null;
}

export default function GeneratedContractDialog({
  isOpen,
  onOpenChange,
  code,
}: GeneratedContractDialogProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const editorStyle = {
    fontFamily: '"Fira code", "Fira Mono", monospace',
    fontSize: 14,
    minHeight: '100%',
    backgroundColor: 'hsl(var(--muted))',
    color: 'hsl(var(--foreground))',
    borderRadius: 'var(--radius)',
  };

  const copyToClipboard = useCallback(() => {
    if (code) {
      navigator.clipboard.writeText(code);
      setHasCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setHasCopied(false), 2000);
    }
  }, [code, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI-Generated Smart Contract</DialogTitle>
          <DialogDescription>
            This is a basic Solidity contract generated from the compliance
            rules. Review and test it thoroughly before deploying.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <ScrollArea className="h-96 w-full rounded-md border bg-muted p-2">
            <Editor
              readOnly
              value={code || '// No code generated'}
              onValueChange={() => {}} // no-op
              highlight={code => highlight(code, languages.solidity, 'solidity')}
              padding={10}
              style={editorStyle}
            />
          </ScrollArea>
           <Button
              size="icon"
              variant="ghost"
              className="absolute right-3 top-3 h-8 w-8"
              onClick={copyToClipboard}
            >
              {hasCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

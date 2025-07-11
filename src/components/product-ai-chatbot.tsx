// src/components/product-ai-chatbot.tsx
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Bot, Send, User as UserIcon, Loader2 } from 'lucide-react';
import { CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { askQuestionAboutProduct } from '@/lib/actions/product-ai-actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface ProductAIChatbotProps {
  productId: string;
}

export default function ProductAIChatbot({ productId }: ProductAIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    startTransition(async () => {
      try {
        const result = await askQuestionAboutProduct(productId, input);
        const aiMessage: Message = { sender: 'ai', text: result.answer };
        setMessages(prev => [...prev, aiMessage]);
      } catch (err) {
        toast({
          title: 'Error',
          description:
            'The AI assistant is currently unavailable. Please try again later.',
          variant: 'destructive',
        });
        // Remove the user's message if the AI fails
        setMessages(prev => prev.slice(0, -1));
      }
    });
  };

  return (
    <div className="flex flex-col h-[450px]">
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.sender === 'user' ? 'justify-end' : '',
                )}
              >
                {message.sender === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot size={20} />
                  </div>
                )}
                <div
                  className={cn(
                    'p-3 rounded-lg max-w-sm',
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                  )}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                {message.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <UserIcon size={20} />
                  </div>
                )}
              </div>
            ))}
            {isPending && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div className="p-3 rounded-lg bg-muted flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
             {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Ask a question about the product's data, like "What is this made of?" or "Is it compliant with RoHS?".</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g., Is this product recyclable?"
            disabled={isPending}
          />
          <Button type="submit" disabled={!input.trim() || isPending}>
            <Send size={16} />
          </Button>
        </form>
      </CardFooter>
    </div>
  );
}

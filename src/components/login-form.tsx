// src/components/login-form.tsx
'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  type MultiFactorResolver,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

const mfaSchema = z.object({
  code: z.string().length(6, { message: 'Code must be 6 digits.' }),
});

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(
    null,
  );
  const router = useRouter();
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mfaForm = useForm<z.infer<typeof mfaSchema>>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '' },
  });

  const onLoginSubmit = useCallback(
    async (values: z.infer<typeof loginSchema>) => {
      setIsLoading(true);
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: 'Login Successful' });
        router.push('/dashboard');
      } catch (error) {
        if (error.code === 'auth/multi-factor-auth-required') {
          setMfaResolver(getMultiFactorResolver(auth, error));
        } else {
          toast({
            title: 'Login Failed',
            description:
              error.message ||
              'An unexpected error occurred. Please check your credentials.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router, toast],
  );

  const onMfaSubmit = useCallback(
    async (values: z.infer<typeof mfaSchema>) => {
      if (!mfaResolver) return;
      setIsLoading(true);
      try {
        const assertion = TotpMultiFactorGenerator.assertionForSignIn(
          mfaResolver.hints[0].uid,
          values.code,
        );
        await mfaResolver.resolveSignIn(assertion);
 toast({ title: 'Login Successful' });
        router.push('/dashboard');
      } catch (error: any) {
        toast({
          title: '2FA Failed',
          description: 'Invalid verification code. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [mfaResolver, toast, router],
  );

  if (mfaResolver) {
    return (
      <Form {...mfaForm}>
        <form
          onSubmit={mfaForm.handleSubmit(onMfaSubmit)}
          className="grid gap-4"
        >
          <FormField
            control={mfaForm.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Two-Factor Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123456"
                    {...field}
                    autoComplete="one-time-code"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...loginForm}>
      <form
        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
        className="grid gap-4"
      >
        <FormField
          control={loginForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="name@example.com"
                  {...field}
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={loginForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log In
        </Button>
      </form>
    </Form>
  );
}

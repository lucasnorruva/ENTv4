"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { signInWithMockUser } from "@/lib/actions";
import { users as mockUsers } from "@/lib/user-data";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const isMockUser = mockUsers.some(user => user.email === values.email);

    try {
      if (isMockUser) {
        // This is a pre-defined user, use the mock sign-in flow
        const mockLoginResult = await signInWithMockUser(
          values.email,
          values.password,
        );
        if (mockLoginResult.success && mockLoginResult.token) {
          await signInWithCustomToken(auth, mockLoginResult.token);
          router.push('/dashboard');
        } else {
          toast({
            title: 'Login Failed',
            description:
              mockLoginResult.error || 'Invalid credentials for mock user.',
            variant: 'destructive',
          });
        }
      } else {
        // This is a user created via sign-up, use standard email/password auth
        await signInWithEmailAndPassword(auth, values.email, values.password);
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description:
          error.message ||
          'An unexpected error occurred. Please check your credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
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
          control={form.control}
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

// src/components/shared/support-page.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { BookOpen, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import SupportForm from '../support-form';
import { getCurrentUser } from '@/lib/auth';
import { UserRoles } from '@/lib/constants';

export default async function SharedSupportPage() {
  // We need to know which user is logged in to pre-fill the form.
  // This will return null if not logged in, but the support page is only
  // shown in authenticated layouts. We'll use a role with broad access
  // as a default for the server-side fetch.
  const user = await getCurrentUser(UserRoles.SUPPLIER).catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Support & Help Center
        </h1>
        <p className="text-muted-foreground">
          Need help? Find answers to common questions or get in touch with our
          team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SupportForm user={user || undefined} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-muted-foreground" />
                FAQs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    What is a Digital Product Passport?
                  </AccordionTrigger>
                  <AccordionContent>
                    A Digital Product Passport is a digital record of a
                    product's lifecycle, from raw materials to recycling. Norruva
                    helps you create and manage these in compliance with EU
                    regulations.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    How does AI compliance work?
                  </AccordionTrigger>
                  <AccordionContent>
                    We use Google's Gemini AI models to analyze your product
                    data against regulations like ESPR. It provides a compliance
                    score and offers actionable suggestions to improve your
                    product's data.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    How do I reset my password?
                  </AccordionTrigger>
                  <AccordionContent>
                    You can reset your password from the Settings page. If you
                    have forgotten your password, use the "Forgot Password" link
                    on the login page.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Explore our comprehensive documentation for guides and API
                references.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/docs/api" target="_blank">
                  View Docs
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


// src/app/dashboard/support/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, LifeBuoy } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
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
        {/* Contact Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>
              Fill out the form below and our team will get back to you as soon
              as possible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your Email Address"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Issue with product verification"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Please describe your issue in detail..."
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Submit Ticket</Button>
          </CardFooter>
        </Card>

        {/* FAQ Section */}
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
                <Link href="/docs/api.md" target="_blank">
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

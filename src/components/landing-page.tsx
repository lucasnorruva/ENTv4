import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  ShieldCheck,
  Box,
  Globe,
  Sparkles,
  FileCog,
  Share2,
  Quote,
} from "lucide-react";
import Logo from "./logo";
import { promises as fs } from "fs";
import path from "path";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

// Function to calculate roadmap progress
async function getRoadmapProgress() {
  try {
    const filePath = path.join(process.cwd(), "docs", "roadmap.md");
    const content = await fs.readFile(filePath, "utf-8");

    const totalTasks = (content.match(/^- \[[ x]\]/gm) || []).length;
    const completedTasks = (content.match(/^- \[x\]/gm) || []).length;

    if (totalTasks === 0) {
      return { percentage: 0, completed: 0, total: 0 };
    }

    const percentage = Math.round((completedTasks / totalTasks) * 100);
    return { percentage, completed: completedTasks, total: totalTasks };
  } catch (error) {
    console.error("Failed to read or parse roadmap.md:", error);
    return { percentage: 0, completed: 0, total: 0 };
  }
}

export default async function LandingPage() {
  const roadmapProgress = await getRoadmapProgress();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <Logo />
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/login"
          >
            Login
          </Link>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <Badge variant="outline" className="text-sm py-1 px-3 mb-4">
                    Project Status: {roadmapProgress.percentage}% Complete
                  </Badge>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none">
                    Unlock Product Trust with Digital Passports
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Norruva is the enterprise-grade platform for creating,
                    managing, and verifying Digital Product Passports (DPPs).
                    Drive transparency, ensure compliance, and build unshakable
                    customer trust.
                  </p>
                  <div className="pt-2">
                    <Progress
                      value={roadmapProgress.percentage}
                      className="w-full h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      {roadmapProgress.completed} / {roadmapProgress.total}{" "}
                      tasks complete
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="lg">
                    <Link href="/signup">
                      Create Your First DPP
                      <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/demo">Explore Features</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/dashboard/admin">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Image
                  alt="Digital Product Passport"
                  className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
                  height="600"
                  src="https://placehold.co/600x600.png"
                  width="600"
                  data-ai-hint="futuristic technology"
                />
                <div className="absolute -bottom-4 -right-4 w-48 p-4 bg-card rounded-lg shadow-lg border">
                  <p className="text-xs font-bold flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-green-500" /> ESG
                    Score: 9.2/10
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Real-time compliance verified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  The Future of Product Intelligence
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides an end-to-end solution for implementing
                  Digital Product Passports at scale, turning regulatory hurdles
                  into a competitive advantage.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <div className="grid gap-2 text-center items-center justify-items-center p-4 rounded-lg hover:bg-card transition-all">
                <Box className="h-10 w-10 text-primary" />
                <h3 className="text-xl font-bold">
                  Immutable Blockchain Anchoring
                </h3>
                <p className="text-sm text-muted-foreground">
                  Secure your product data on Polygon or EBSI for unparalleled
                  trust and data integrity.
                </p>
              </div>
              <div className="grid gap-2 text-center items-center justify-items-center p-4 rounded-lg hover:bg-card transition-all">
                <Sparkles className="h-10 w-10 text-primary" />
                <h3 className="text-xl font-bold">AI-Powered Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  Leverage Genkit AI for automated ESG scoring and regulatory
                  analysis, ensuring your products meet EU standards
                  effortlessly.
                </p>
              </div>
              <div className="grid gap-2 text-center items-center justify-items-center p-4 rounded-lg hover:bg-card transition-all">
                <Globe className="h-10 w-10 text-primary" />
                <h3 className="text-xl font-bold">Global Interoperability</h3>
                <p className="text-sm text-muted-foreground">
                  Built-in support for GS1 Digital Link, UN/CEFACT, and W3C
                  Verifiable Credentials for seamless global data exchange.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium">
                  How It Works
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Full Transparency in 3 Simple Steps
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Go from complex supply chains to clear, verifiable product
                  stories in minutes.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <FileCog className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">1. Create & Aggregate</h3>
                </div>
                <p className="text-muted-foreground">
                  Easily aggregate data from your supply chain and use our AI
                  tools to generate a comprehensive DPP.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">2. Verify & Anchor</h3>
                </div>
                <p className="text-muted-foreground">
                  Validate data for accuracy and anchor the DPP on a public
                  blockchain for immutable proof.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">3. Share & Engage</h3>
                </div>
                <p className="text-muted-foreground">
                  Share the DPP with consumers, regulators, and partners via QR
                  codes or our secure API.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <Quote className="h-10 w-10 text-primary mx-auto mb-4" />
              <p className="text-xl md:text-2xl font-medium">
                "Norruva has revolutionized our approach to compliance. What
                used to take months of manual work now takes hours. It's an
                essential tool for any modern, sustainable brand."
              </p>
              <div className="mt-6">
                <p className="font-semibold">Jane Doe</p>
                <p className="text-sm text-muted-foreground">
                  Head of Sustainability, EcoWear Inc.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Frequently Asked Questions
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Have questions? We've got answers.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl w-full mt-12">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    What is a Digital Product Passport (DPP)?
                  </AccordionTrigger>
                  <AccordionContent>
                    A Digital Product Passport is a digital record of a
                    product's lifecycle, from raw materials to recycling. It
                    provides transparency and traceability, helping consumers
                    and businesses make more informed and sustainable choices.
                    Norruva helps you create and manage these passports in
                    compliance with EU regulations.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    Is Norruva suitable for small businesses?
                  </AccordionTrigger>
                  <AccordionContent>
                    Absolutely! Our platform is designed to be scalable. We
                    offer different tiers, including a free starting plan,
                    making it accessible for businesses of all sizes to begin
                    their journey towards product transparency and compliance.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    How does the AI-powered compliance work?
                  </AccordionTrigger>
                  <AccordionContent>
                    We use Genkit AI trained on EU regulations like ESPR and
                    CSRD. Our system analyzes your product data against these
                    regulations, provides a compliance score, and offers
                    actionable suggestions to improve your product's
                    sustainability and data accuracy.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    Do I need to know about blockchain to use Norruva?
                  </AccordionTrigger>
                  <AccordionContent>
                    Not at all. We handle all the blockchain complexity behind
                    the scenes. You can anchor your product data with a single
                    click, providing an immutable record of your claims without
                    needing any specialized technical knowledge.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Pricing Section Placeholder */}
        <section
          id="pricing"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium">
                  Pricing
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Coming Soon
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We are currently finalizing our pricing plans. Stay tuned for
                  simple, transparent pricing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Build Trust?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join the leading brands in preparing for the future of product
                transparency. Sign up today and get started for free.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg" className="w-full">
                <Link href="/signup">
                  Sign Up for Free
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2024 Norruva. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-xs hover:underline underline-offset-4"
            href="/docs"
          >
            Docs
          </Link>
          <Link
            className="text-xs hover:underline underline-offset-4"
            href="/terms"
          >
            Terms of Service
          </Link>
          <Link
            className="text-xs hover:underline underline-offset-4"
            href="/privacy"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

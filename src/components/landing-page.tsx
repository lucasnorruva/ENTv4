
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Code2,
  Globe,
  Recycle,
  Fingerprint,
  CheckCircle,
  FlaskConical,
  Layers,
  Car,
  User,
  Truck,
  Factory,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import Logo from './logo';
import { Badge } from './ui/badge';

// Feature data
const features = [
  {
    icon: ShieldCheck,
    title: 'Automated Compliance',
    description:
      'Continuously monitor against 75+ global regulations like ESPR, and CSRD with our AI-powered compliance engine.',
  },
  {
    icon: Cpu,
    title: 'AI-Powered Insights',
    description:
      'Generate ESG scores, predict product lifecycles, and receive actionable suggestions to improve sustainability.',
  },
  {
    icon: Fingerprint,
    title: 'Blockchain Anchoring',
    description:
      'Create immutable, verifiable proof of product data integrity by anchoring passports on public blockchains like Polygon.',
  },
  {
    icon: Code2,
    title: 'Developer-First APIs',
    description:
      'Integrate DPP functionality into any system with our robust GraphQL and REST APIs, designed for flexibility and scale.',
  },
  {
    icon: Recycle,
    title: 'Circular Economy Tools',
    description:
      'Enable end-of-life tracking, manage service records, and facilitate a truly circular product lifecycle.',
  },
  {
    icon: Globe,
    title: 'Global Supply Chain Visibility',
    description:
      'Visualize your entire supply chain, track products in transit, and get real-time customs alerts on an interactive 3D globe.',
  },
];

// How it works data
const steps = [
  {
    step: '01',
    title: 'Connect Your Data',
    description:
      'Integrate with your existing ERP and PLM systems or upload data in bulk to create a single source of truth for product information.',
  },
  {
    step: '02',
    title: 'Automate & Enrich',
    description:
      'Our AI engine automatically validates data, calculates sustainability scores, and generates compliance reports, saving you time and effort.',
  },
  {
    step: '03',
    title: 'Publish & Anchor',
    description:
      'Publish W3C-compliant Verifiable Credentials for each product and anchor their data hash on the blockchain for ultimate trust.',
  },
  {
    step: '04',
    title: 'Share & Verify',
    description:
      'Share passports with consumers via QR codes, with partners via API, and with regulators through secure, auditable logs.',
  },
];

const lifecycleStages = [
  {
    icon: FlaskConical,
    title: 'MATERIAL',
    stakeholder: 'Material Manufacturers & Compounders',
    dataPoints: ['+ Origin', '+ Certificates', '+ Audit Reports'],
  },
  {
    icon: Layers,
    title: 'PART',
    stakeholder: 'Moulders & Part Manufacturers',
    dataPoints: ['+ Process Conditions', '+ Bill of Materials'],
  },
  {
    icon: Car,
    title: 'PRODUCT',
    stakeholder: 'OEMs & Brand Owners',
    dataPoints: ['+ (Repair) Manuals', '+ Provenance'],
  },
  {
    icon: User,
    title: 'EOL PRODUCT',
    stakeholder: 'Users & Consumers',
    dataPoints: ['+ Usage logs', '+ Maintenance history'],
  },
  {
    icon: Truck,
    title: 'WASTE',
    stakeholder: 'Collectors & (Pre-)Sorters',
    dataPoints: ['+ Specifications', '+ Recovery logs'],
  },
  {
    icon: Factory,
    title: 'RECYCLED',
    stakeholder: 'Recyclers & Refiners',
    dataPoints: ['+ Certificates', '+ Quality assurances'],
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="px-4 lg:px-6 h-20 flex items-center sticky top-0 bg-background/95 backdrop-blur-sm z-50 border-b">
        <div className="flex items-center justify-between w-full container">
          <Logo />
          <nav className="hidden lg:flex items-center gap-4 text-sm font-medium">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#circular-economy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Ecosystem
            </Link>
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/demo">
                Explore Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full pt-20 md:pt-24 lg:pt-32 pb-20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <Badge
                    variant="outline"
                    className="py-1 px-3 text-primary border-primary/50"
                  >
                    The Future of Product Transparency
                  </Badge>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none">
                    The OS for Verifiable Product Data
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Norruva is the enterprise-grade platform for creating,
                    managing, and sharing Digital Product Passports. Automate
                    compliance, enrich data with AI, and build trust with
                    blockchain-anchored proof.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild>
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/dashboard/admin">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>

              <div className="relative flex items-center justify-center h-[550px]">
                <Image
                  alt="Abstract Sphere"
                  className="absolute opacity-30 dark:opacity-20"
                  height="600"
                  src="https://placehold.co/600x600.png"
                  width="600"
                  data-ai-hint="abstract network"
                />
                <Card className="z-10 w-full max-w-sm shadow-xl animate-fade-in bg-card text-card-foreground p-6 rounded-2xl">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-bold text-lg">GreenLeaf</h2>
                      <p className="text-xs text-muted-foreground">
                        Product ID: dpp-004
                      </p>
                    </div>
                    <Image
                      src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://norruva.com/products/dpp-004&bgcolor=ffffff&color=000000&qzone=1"
                      width={60}
                      height={60}
                      alt="QR Code"
                      data-ai-hint="qr code"
                    />
                  </div>

                  {/* Main Info */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-muted p-3 rounded-lg">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-primary"
                      >
                        <path
                          d="M8 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M12 11.5v6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9.5 13.5v2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M14.5 13.5v2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M7 21a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M12 7V3"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M14 5h-4"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Bamboo Cutlery Set</h3>
                      <Badge
                        variant="outline"
                        className="mt-1 border-primary/50 text-primary text-xs"
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified Product Passport
                      </Badge>
                    </div>
                  </div>

                  {/* EU Regulation Status */}
                  <div className="bg-muted flex justify-between items-center p-3 rounded-lg mb-6">
                    <span className="text-sm font-medium text-muted-foreground">
                      EU Regulation Status
                    </span>
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      COMPLIANT
                    </Badge>
                  </div>

                  {/* Material Traceability */}
                  <div className="text-center mb-6">
                    <p className="font-semibold text-card-foreground text-xs uppercase mb-3">
                      Material Traceability
                    </p>
                    <div className="relative inline-flex items-center justify-center w-28 h-28">
                      <svg
                        className="w-full h-full"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          className="text-muted/50"
                          strokeWidth="10"
                          stroke="currentColor"
                          fill="transparent"
                          r="45"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          className="text-primary"
                          strokeWidth="10"
                          strokeDasharray="283"
                          strokeDashoffset="calc(283 - (283 * 98) / 100))"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="45"
                          cx="50"
                          cy="50"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <span className="absolute text-2xl font-bold text-primary">
                        98%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Traced Materials In Product
                    </p>
                  </div>

                  {/* Chain of Custody */}
                  <div className="mb-6">
                    <p className="font-semibold text-card-foreground text-xs uppercase mb-3">
                      Chain of Custody
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                          Bamboo Harvested
                        </span>
                        <span className="text-xs text-muted-foreground">
                          05/01/24 &middot; China
                        </span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                          Cutlery Shaped
                        </span>
                        <span className="text-xs text-muted-foreground">
                          20/01/24 &middot; China
                        </span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                          Shipped to EU
                        </span>
                        <span className="text-xs text-muted-foreground">
                          01/03/24 &middot; EU Warehouse
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Footer Button */}
                  <Button asChild className="w-full">
                    <Link href="#">
                      View Passport <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  A Fully-Featured DPP Platform
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From AI-driven compliance to blockchain verification, Norruva
                  provides all the tools you need to lead in product
                  transparency.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:grid-cols-3 lg:gap-12 mt-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="grid gap-2 text-center md:text-left md:flex md:items-start md:gap-4"
                >
                  <div className="flex justify-center">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                      <feature.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Go from Data to DPP in Minutes
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our streamlined workflow simplifies the creation and management
                  of Digital Product Passports at scale.
                </p>
              </div>
            </div>
            <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="absolute left-0 top-1/2 h-px w-full bg-border -translate-y-1/2 hidden sm:block"></div>
              {steps.map(step => (
                <div
                  key={step.step}
                  className="relative text-center sm:text-left"
                >
                  <div className="flex sm:flex-col items-center sm:items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background text-primary text-xl font-bold shrink-0 z-10">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{step.title}</h3>
                      <p className="mt-1 text-muted-foreground text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* New Circular Economy Section */}
        <section
          id="circular-economy"
          className="w-full py-20 md:py-32 bg-muted/50"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="py-1 px-3 text-primary border-primary/50"
                >
                  A Connected Ecosystem
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Digital Passports for a Circular Economy
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Norruva connects every stakeholder and data point across the
                  product lifecycle, creating a transparent, verifiable, and
                  sustainable ecosystem from raw material to recycling.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lifecycleStages.map((stage, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <stage.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle>{stage.title}</CardTitle>
                        <CardDescription>{stage.stakeholder}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {stage.dataPoints.map((point, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{point.replace(/^\+ /, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="w-full py-20 md:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Trusted by Industry Leaders
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Norruva is built to scale and is trusted by leading
                manufacturers and brands to manage their global product data.
              </p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 pt-6 opacity-60">
              <Image
                src="https://placehold.co/120x40.png"
                alt="Client Logo 1"
                width={120}
                height={40}
                data-ai-hint="company logo"
              />
              <Image
                src="https://placehold.co/120x40.png"
                alt="Client Logo 2"
                width={120}
                height={40}
                data-ai-hint="company logo"
              />
              <Image
                src="https://placehold.co/120x40.png"
                alt="Client Logo 3"
                width={120}
                height={40}
                data-ai-hint="company logo"
              />
              <Image
                src="https://placehold.co/120x40.png"
                alt="Client Logo 4"
                width={120}
                height={40}
                data-ai-hint="company logo"
              />
              <Image
                src="https://placehold.co/120x40.png"
                alt="Client Logo 5"
                width={120}
                height={40}
                data-ai-hint="company logo"
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-20 md:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Get Started?
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Explore our interactive demo to see the platform in action, or
                dive into our documentation to start building today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mx-auto mt-4">
              <Button size="lg" asChild>
                <Link href="/demo">Explore the Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">Read the Docs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col gap-4 sm:flex-row py-6 shrink-0 items-center px-4 md:px-6">
          <Logo />
          <p className="text-xs text-muted-foreground sm:ml-auto">
            © 2024 Norruva. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
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
        </div>
      </footer>
    </div>
  );
}

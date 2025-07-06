
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Unplug,
  Code2,
  Play,
  Download,
  SlidersHorizontal,
  Instagram,
  Twitter,
  Users,
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Logo from './logo';

const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M11.623 15.111c-1.398 0-2.617-.432-3.64-1.152a5.485 5.485 0 0 1-1.956-1.956c-.72-1.023-1.152-2.242-1.152-3.64V2.88H8.51v5.485c0 .73.187 1.41.524 2.01.338.6.793 1.056 1.393 1.393.6.338 1.28.524 2.01.524a5.485 5.485 0 0 0 3.966-1.956V2.88h3.636v11.492c-1.686 2.304-4.32 3.696-7.272 3.696Z" />
    <path d="M11.623 15.111c-1.398 0-2.617-.432-3.64-1.152a5.485 5.485 0 0 1-1.956-1.956c-.72-1.023-1.152-2.242-1.152-3.64V2.88H8.51v5.485c0 .73.187 1.41.524 2.01.338.6.793 1.056 1.393 1.393.6.338 1.28.524 2.01.524a5.485 5.485 0 0 0 3.966-1.956V2.88h3.636v11.492c-1.686 2.304-4.32 3.696-7.272 3.696Z" />
  </svg>
);

const chartData = [
  { name: 'Jan', performance: 60, sales: 40 },
  { name: 'Feb', performance: 70, sales: 50 },
  { name: 'Mar', performance: 80, sales: 70 },
  { name: 'Apr', performance: 90, sales: 85 },
  { name: 'May', performance: 85, sales: 88 },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="px-4 lg:px-6 h-20 flex items-center sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="flex items-center justify-between w-full">
          <Logo />
          <nav className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <TiktokIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Instagram className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Twitter className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border mx-2"></div>
            <Button variant="outline" className="rounded-full text-xs h-8">
              info@norruva.com
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full h-10 hidden sm:flex">
              Menu
            </Button>
            <Button asChild className="rounded-full h-10">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full pt-12 md:pt-24 lg:pt-32 pb-20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <p className="font-semibold tracking-wide text-sm">
                    WE ARE NORRUVA
                  </p>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none">
                    Generate Business Outcomes with Verifiable Data
                  </h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="lg" className="rounded-full">
                    Get Started
                  </Button>
                  <Button size="lg" variant="ghost" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Contact Us
                  </Button>
                </div>
                <p className="max-w-[600px] text-muted-foreground text-sm">
                  We care for your technology so you can care for your business.
                </p>
                <div className="flex items-center gap-8 text-center pt-4">
                  <div>
                    <p className="text-3xl font-bold">75+</p>
                    <p className="text-xs text-muted-foreground">Regulations</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">1M+</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">99.9%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <Image
                  alt="Abstract 3D structure"
                  className="mx-auto aspect-square overflow-hidden object-cover"
                  height="500"
                  src="https://placehold.co/600x600.png"
                  width="500"
                  data-ai-hint="abstract cubes"
                />
                <Card className="absolute top-10 right-0 w-64 shadow-xl">
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Case Examples
                    </p>
                    <h4 className="font-semibold mt-1">About Norruva Platform</h4>
                    <Button variant="ghost" size="sm" className="mt-2 pl-0">
                      <Play className="mr-2 h-4 w-4" /> Play
                    </Button>
                    <div className="flex gap-2 mt-2">
                       <Image src="https://placehold.co/50x50.png" data-ai-hint="technology abstract" alt="thumbnail 1" width={50} height={50} className="rounded-md" />
                       <Image src="https://placehold.co/50x50.png" data-ai-hint="data abstract" alt="thumbnail 2" width={50} height={50} className="rounded-md" />
                       <Image src="https://placehold.co/50x50.png" data-ai-hint="compliance abstract" alt="thumbnail 3" width={50} height={50} className="rounded-md" />
                    </div>
                  </div>
                </Card>
                 <Card className="absolute bottom-10 right-0 w-64 shadow-xl">
                   <div className="p-4">
                     <div className="flex justify-between text-xs font-semibold mb-2">
                       <p>COMPLIANCE: 92%</p>
                       <p>ESG SCORE: 88% ↑</p>
                     </div>
                     <ResponsiveContainer width="100%" height={80}>
                        <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                          <Bar dataKey="performance" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Our Core Services
                </h2>
              </div>
            </div>
            <div className="mx-auto flex flex-wrap justify-center gap-2 py-8">
              <Button variant="outline" className="rounded-full bg-background">01 / ENTERPRISE HARDWARE</Button>
              <Button variant="outline" className="rounded-full bg-background">02 / ENTERPRISE SOFTWARE</Button>
              <Button variant="outline" className="rounded-full bg-background">03 / NETWORK INFRASTRUCTURE</Button>
              <Button variant="outline" className="rounded-full bg-background">04 / NETWORK SECURITY</Button>
            </div>
             <div className="flex items-center justify-center gap-2 text-sm">
                <Users className="h-5 w-5"/>
                <span className="font-bold">+1.2K</span>
                <span className="text-muted-foreground">Users are satisfied with our services</span>
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

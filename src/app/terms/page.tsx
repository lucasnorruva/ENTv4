import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7 text-primary"
      >
        <path d="M17 17l-10-10"></path>
        <path d="M17 7v10"></path>
        <path d="M7 17V7"></path>
      </svg>
      <h1 className="text-2xl font-bold">Norruva</h1>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <Logo />
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2" />
              Back to Home
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1 py-12 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: July 22, 2024</p>

            <div className="space-y-4 text-foreground/80">
              <h2 className="text-2xl font-semibold pt-4">1. Introduction</h2>
              <p>
                Welcome to Norruva! These Terms of Service ("Terms") govern your
                use of our website and services. By accessing or using our
                service, you agree to be bound by these Terms. This is a
                placeholder document and is not legally binding.
              </p>

              <h2 className="text-2xl font-semibold pt-4">
                2. Use of Our Service
              </h2>
              <p>
                You agree to use our services for lawful purposes only and in a
                way that does not infringe the rights of, restrict, or inhibit
                anyone else's use and enjoyment of the service. The service is
                provided "as is" without any warranties.
              </p>

              <h2 className="text-2xl font-semibold pt-4">3. Accounts</h2>
              <p>
                When you create an account with us, you must provide us with
                information that is accurate, complete, and current at all
                times. Failure to do so constitutes a breach of the Terms, which
                may result in immediate termination of your account on our
                service.
              </p>

              <h2 className="text-2xl font-semibold pt-4">
                4. Intellectual Property
              </h2>
              <p>
                The service and its original content, features, and
                functionality are and will remain the exclusive property of
                Norruva and its licensors. The content generated here is for
                demonstration purposes only.
              </p>

              <h2 className="text-2xl font-semibold pt-4">5. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without
                prior notice or liability, for any reason whatsoever, including
                without limitation if you breach the Terms.
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 px-4 md:px-6">
        <div className="container mx-auto text-center text-xs text-muted-foreground">
          © 2024 Norruva. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

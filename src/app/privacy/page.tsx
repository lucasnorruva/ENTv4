import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/logo";

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: July 22, 2024</p>

            <div className="space-y-4 text-foreground/80">
              <h2 className="text-2xl font-semibold pt-4">
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us when you
                create an account, such as your name and email address. We also
                collect log data about your use of the services. This is a
                placeholder document and is not legally binding.
              </p>

              <h2 className="text-2xl font-semibold pt-4">
                2. How We Use Information
              </h2>
              <p>
                We use the information we collect to provide, maintain, and
                improve our services. We do not share your personal information
                with third parties except as described in this policy or with
                your consent.
              </p>

              <h2 className="text-2xl font-semibold pt-4">3. Data Storage</h2>
              <p>
                Your information is stored on secure servers. We take reasonable
                measures to protect your information from loss, theft, misuse,
                and unauthorized access.
              </p>

              <h2 className="text-2xl font-semibold pt-4">4. Your Choices</h2>
              <p>
                You may update, correct, or delete information about you at any
                time by logging into your account. If you wish to delete your
                account, please contact us, but note that we may retain certain
                information as required by law or for legitimate business
                purposes.
              </p>

              <h2 className="text-2xl font-semibold pt-4">
                5. Changes to This Policy
              </h2>
              <p>
                We may change this Privacy Policy from time to time. If we make
                changes, we will notify you by revising the date at the top of
                the policy and, in some cases, we may provide you with
                additional notice.
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 px-4 md:px-6">
        <div className="container mx-auto text-center text-xs text-muted-foreground">
          © 2024 PassportFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

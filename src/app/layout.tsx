import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SWRegister from "@/components/sw-register";
import { cn } from "@/lib/utils";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });

export const metadata: Metadata = {
  title: "PassportFlow",
  description: "The Future of Product Transparency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={cn("antialiased", lexend.variable)}>
        {children}
        <Toaster />
        <SWRegister />
      </body>
    </html>
  );
}

"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  logoUrl?: string;
  companyName?: string;
}

export default function Logo({ className, logoUrl, companyName }: LogoProps) {
  if (logoUrl) {
    return (
      <Link href="/" className="flex items-center">
        <Image
          src={logoUrl}
          alt={`${companyName || 'Custom'} Logo`}
          width={120}
          height={40}
          className={cn("object-contain h-8", className)}
          data-ai-hint="logo"
        />
      </Link>
    );
  }

  return (
    <Link href="/" className="flex items-center gap-2">
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
      <h1 className={cn("text-2xl font-bold", className)}>Norruva</h1>
    </Link>
  );
}

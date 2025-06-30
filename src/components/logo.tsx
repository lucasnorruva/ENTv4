"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface LogoProps {
  className?: string;
}

// This component is intentionally simple.
// It uses an h1 tag which can be overridden by the parent if needed,
// but for SEO on most pages this is fine.
export default function Logo({ className }: LogoProps) {
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

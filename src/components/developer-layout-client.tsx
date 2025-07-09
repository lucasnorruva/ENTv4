// src/components/developer-layout-client.tsx
'use client';

import React from 'react';
import type { User } from '@/types';
import Logo from './logo';
import { ThemeToggle } from './theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  UserCircle,
  Menu,
} from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent } from './ui/sheet';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GlobalSearchButton from './global-search-button';
import { developerNavItems } from '@/lib/nav-config';
import DeveloperNavTabs from './developer-nav-tabs';
import Link from 'next/link';

interface DeveloperLayoutClientProps {
  user: User;
  children: React.ReactNode;
}

export default function DeveloperLayoutClient({
  user,
  children,
}: DeveloperLayoutClientProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <Logo />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <div className="mb-4">
                  <Logo />
                </div>
                {developerNavItems.map(item => (
                  <Link
                    key={item.text}
                    href={item.href}
                    target={item.external ? '_blank' : '_self'}
                    className="flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.text}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <span className="border-r pr-4 font-semibold text-lg text-foreground">
            Developer Portal
          </span>
          <div className="flex items-center gap-2">
            <span>Org:</span>
            <Select defaultValue="acme-innovations">
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Select Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acme-innovations">
                  Acme Innovations
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span>Environment:</span>
            <Select defaultValue="sandbox">
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Select Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production" disabled>
                  Production
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <GlobalSearchButton user={user} role="Developer" />
          <ThemeToggle />
          <Avatar>
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>
              <UserCircle />
            </AvatarFallback>
          </Avatar>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <DeveloperNavTabs />
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}

// src/components/developer-layout-client.tsx
'use client';

import React from 'react';
import type { User } from '@/types';
import Logo from './logo';
import { ThemeToggle } from './theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { UserCircle, PanelLeft } from 'lucide-react';
import DeveloperNav from './developer-nav';
import { Sheet, SheetTrigger, SheetContent } from './ui/sheet';
import { Button } from './ui/button';

interface DeveloperLayoutClientProps {
  user: User;
  children: React.ReactNode;
}

export default function DeveloperLayoutClient({
  user,
  children,
}: DeveloperLayoutClientProps) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Logo />
          </div>
          <div className="flex-1">
            <DeveloperNav />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <div className="mb-4">
                  <Logo />
                </div>
                <DeveloperNav />
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            {/* Future search can go here */}
          </div>
          <ThemeToggle />
          <Avatar className="ml-4">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>
              <UserCircle />
            </AvatarFallback>
          </Avatar>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

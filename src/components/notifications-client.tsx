// src/components/notifications-client.tsx
'use client';

import { Bell, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuFooter,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import type { ProcessedNotification } from './notifications-panel';
import Link from 'next/link';
import { Badge } from './ui/badge';

interface NotificationsClientProps {
  notifications: ProcessedNotification[];
}

export default function NotificationsClient({
  notifications,
}: NotificationsClientProps) {
  const unreadCount = notifications.length; // In a real app, this would track read status

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              className="flex items-start gap-3"
            >
              <notification.Icon className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="text-xs text-muted-foreground">
                  {notification.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.timestamp}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No new notifications.
          </p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuFooter className="p-1">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/history">
              View All Activity <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </DropdownMenuFooter>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

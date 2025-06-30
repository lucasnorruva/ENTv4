
// src/components/notifications-client.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  ArrowRight,
  Clock,
  Edit,
  FilePlus,
  FileUp,
  Trash2,
  CheckCircle,
  FileX,
  Calculator,
  Recycle,
  ShieldX,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { ProcessedNotification } from './notifications-panel';
import { markAllNotificationsAsRead } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const actionIcons: Record<string, React.ElementType> = {
  'product.created': FilePlus,
  'product.updated': Edit,
  'product.deleted': Trash2,
  'product.recycled': Recycle,
  'product.recalculate_score': Calculator,
  'passport.submitted': FileUp,
  'passport.approved': CheckCircle,
  'passport.rejected': FileX,
  'compliance.resolved': ShieldX,
  default: Clock,
};

interface NotificationsClientProps {
  notifications: ProcessedNotification[];
  userId: string;
}

export default function NotificationsClient({
  notifications,
  userId,
}: NotificationsClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // When the dropdown is opened and there are unread notifications,
    // call the server action to mark them as read.
    if (isOpen && unreadCount > 0) {
      startTransition(async () => {
        try {
          await markAllNotificationsAsRead(userId);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Could not mark notifications as read.',
            variant: 'destructive',
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, unreadCount, userId]);

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
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
          notifications.map(notification => {
            const Icon =
              actionIcons[notification.action] || actionIcons.default;
            return (
              <DropdownMenuItem
                key={notification.id}
                className="items-start gap-2"
              >
                <div className="w-2 flex-shrink-0 pt-[9px]">
                  {!notification.isRead && !isPending && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.description}
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-1"
                    suppressHydrationWarning
                  >
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No new notifications.
          </p>
        )}
        <DropdownMenuSeparator />
        <div className="p-1">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/history">
              View All Activity <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

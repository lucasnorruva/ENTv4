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
  Loader2,
  Wrench,
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
import type { User, AuditLog, Product } from '@/types';
import {
  markAllNotificationsAsRead,
  getAuditLogs,
  getProducts,
  getUsers,
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

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
  'product.serviced': Wrench,
  default: Clock,
};

const getActionLabel = (action: string): string => {
  return action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export interface ProcessedNotification {
  id: string;
  action: string;
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationsClientProps {
  user: User;
}

export default function NotificationsClient({ user }: NotificationsClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<ProcessedNotification[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const [logs, products, allUsers] = await Promise.all([
          getAuditLogs({ companyId: user.companyId }),
          getProducts(user.id),
          getUsers(),
        ]);

        const productMap = new Map(products.map(p => [p.id, p.productName]));
        const userMap = new Map(allUsers.map(u => [u.id, u.fullName]));

        // Limit to recent logs
        const recentLogs = logs.slice(0, 5);

        const processedNotifications: ProcessedNotification[] = recentLogs.map(
          log => {
            const logUser = userMap.get(log.userId) || 'System';
            const product = productMap.get(log.entityId);
            const title = getActionLabel(log.action);
            let description = `By ${logUser}`;
            if (product) {
              description += ` on "${product}"`;
            }

            const isRead = user.readNotificationIds?.includes(log.id) ?? false;

            return {
              id: log.id,
              action: log.action,
              title,
              description,
              createdAt: log.createdAt,
              isRead,
            };
          },
        );
        setNotifications(processedNotifications);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load notifications.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, [user.id, user.companyId, user.readNotificationIds, toast]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      startTransition(async () => {
        const previousNotifications = notifications;
        // Optimistic update
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        try {
          await markAllNotificationsAsRead(user.id);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Could not mark notifications as read.',
            variant: 'destructive',
          });
          // Rollback on error
          setNotifications(previousNotifications);
        }
      });
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
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
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map(notification => {
            const Icon =
              actionIcons[notification.action] || actionIcons.default;
            return (
              <DropdownMenuItem
                key={notification.id}
                className="items-start gap-2"
              >
                <div className="w-2 flex-shrink-0 pt-[9px]">
                  {!notification.isRead && (
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
            <Link href="/dashboard/supplier/history">
              View All Activity <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

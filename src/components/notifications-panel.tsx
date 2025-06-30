
// src/components/notifications-panel.tsx

import { getAuditLogs, getUsers, getProducts } from '@/lib/actions';
import NotificationsClient from './notifications-client';
import type { User } from '@/types';

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
  createdAt: string; // Pass raw date string
  isRead: boolean;
}

export default async function NotificationsPanel({ user }: { user: User }) {
  // Fetch data on the server
  const [logs, products, allUsers] = await Promise.all([
    getAuditLogs(),
    getProducts(),
    getUsers(),
  ]);

  const productMap = new Map(products.map(p => [p.id, p.productName]));
  const userMap = new Map(allUsers.map(u => [u.id, u.fullName]));

  // In a real app, you might filter logs based on user relevance
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
        createdAt: log.createdAt, // Pass the ISO date string
        isRead,
      };
    },
  );

  return (
    <NotificationsClient
      notifications={processedNotifications}
      userId={user.id}
    />
  );
}

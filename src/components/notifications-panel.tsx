// src/components/notifications-panel.tsx

import { getAuditLogs, getUsers, getProducts } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';
import NotificationsClient from './notifications-client';

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
  timestamp: string;
}

export default async function NotificationsPanel() {
  // Fetch data on the server
  const [logs, products, users] = await Promise.all([
    getAuditLogs(),
    getProducts(),
    getUsers(),
  ]);

  const productMap = new Map(products.map(p => [p.id, p.productName]));
  const userMap = new Map(users.map(u => [u.id, u.fullName]));

  const recentLogs = logs.slice(0, 5);

  const processedNotifications: ProcessedNotification[] = recentLogs.map(
    log => {
      const user = userMap.get(log.userId) || 'System';
      const product = productMap.get(log.entityId);
      const title = getActionLabel(log.action);
      let description = `By ${user}`;
      if (product) {
        description += ` on "${product}"`;
      }

      return {
        id: log.id,
        action: log.action,
        title,
        description,
        timestamp: formatDistanceToNow(new Date(log.createdAt), {
          addSuffix: true,
        }),
      };
    },
  );

  return <NotificationsClient notifications={processedNotifications} />;
}

// src/components/notifications-panel.tsx

import {
  getAuditLogs,
  getUsers,
  getProducts,
  getCurrentUser,
} from '@/lib/actions';
import {
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
import NotificationsClient from './notifications-client';
import { UserRoles } from '@/lib/constants';

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

const getActionLabel = (action: string): string => {
  return action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export interface ProcessedNotification {
  id: string;
  Icon: React.ElementType;
  title: string;
  description: string;
  timestamp: string;
}

export default async function NotificationsPanel() {
  // Fetch data on the server
  const [logs, products, users, currentUser] = await Promise.all([
    getAuditLogs(),
    getProducts(),
    getUsers(),
    getCurrentUser(UserRoles.ADMIN), // Assuming admin sees all, adjust as needed
  ]);

  const productMap = new Map(products.map(p => [p.id, p.productName]));
  const userMap = new Map(users.map(u => [u.id, u.fullName]));

  const recentLogs = logs.slice(0, 5);

  const processedNotifications: ProcessedNotification[] = recentLogs.map(
    log => {
      const Icon = actionIcons[log.action] || actionIcons.default;
      const user = userMap.get(log.userId) || 'System';
      const product = productMap.get(log.entityId);
      const title = getActionLabel(log.action);
      let description = `By ${user}`;
      if (product) {
        description += ` on "${product}"`;
      }

      return {
        id: log.id,
        Icon,
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

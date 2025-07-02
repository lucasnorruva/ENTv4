// src/components/notifications-panel.tsx

import NotificationsClient from './notifications-client';
import type { User } from '@/types';

export default function NotificationsPanel({ user }: { user: User }) {
  // The client component now handles all data fetching and state management.
  return <NotificationsClient user={user} />;
}

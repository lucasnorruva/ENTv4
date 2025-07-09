// src/components/audit-log-timeline.tsx
'use client';

import type { AuditLog } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  List,
  Wrench,
  Globe,
  ShieldAlert,
} from 'lucide-react';
import RelativeTime from './relative-time';

const actionIcons: Record<string, React.ElementType> = {
  'product.created': FilePlus,
  'product.updated': Edit,
  'product.deleted': Trash2,
  'product.recycled': Recycle,
  'product.recalculate_score': Calculator,
  'passport.submitted': FileUp,
  'passport.approved': CheckCircle,
  'passport.rejected': FileX,
  'product.verification.overridden': ShieldAlert,
  'compliance.resolved': ShieldX,
  'product.serviced': Wrench,
  'customs.inspected': Globe,
  default: Clock,
};

const getActionLabel = (action: string): string => {
  return action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AuditLogTimeline({
  logs,
  userMap,
}: {
  logs: AuditLog[];
  userMap: Map<string, string>;
}) {
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            A chronological history of all actions taken on this passport.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <List className="mx-auto h-12 w-12" />
            <p className="mt-4">No activity history found for this product.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>
          A chronological history of all actions taken on this passport.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          <div className="absolute left-[35px] top-0 h-full w-px bg-border -translate-x-1/2" />
          {logs.map((log, index) => {
            const Icon = actionIcons[log.action] || actionIcons.default;
            const label = getActionLabel(log.action);
            const userName = userMap.get(log.userId) || log.userId;

            return (
              <div
                key={log.id}
                className="relative mb-8 flex items-start pl-8"
              >
                <div className="absolute left-0 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground -translate-x-1/2">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{label}</p>
                    <RelativeTime
                      date={log.createdAt}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Action performed by{' '}
                    <span className="font-semibold text-foreground">
                      {userName}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

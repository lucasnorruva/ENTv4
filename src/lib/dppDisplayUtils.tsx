// src/lib/dppDisplayUtils.tsx
import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from './utils';

export function getStatusIcon(status: string | undefined) {
  switch (status) {
    case 'Verified':
      return <CheckCircle />;
    case 'Pending':
      return <Clock />;
    case 'Failed':
    default:
      return <AlertTriangle />;
  }
}

export function getStatusBadgeVariant(status: string | undefined) {
  switch (status) {
    case 'Verified':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Failed':
    default:
      return 'destructive';
  }
}

export function getStatusBadgeClasses(status: string | undefined) {
  switch (status) {
    case 'Verified':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
    case 'Pending':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700';
    case 'Failed':
    default:
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
  }
}

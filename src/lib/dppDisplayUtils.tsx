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

export function getStatusBadgeVariant(status: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Verified':
    case 'Cleared':
      return 'default';
    case 'Pending':
    case 'Detained':
      return 'secondary';
    case 'Failed':
    case 'Rejected':
    default:
      return 'destructive';
  }
}

export function getStatusBadgeClasses(status: string | undefined) {
  switch (status) {
    case 'Verified':
    case 'Cleared':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
    case 'Pending':
    case 'Detained':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700';
    case 'Failed':
    case 'Rejected':
    default:
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
  }
}

export function getPointColorForStatus(status: string | undefined): string {
  switch (status) {
    case 'Verified':
      return '#22C55E'; // green-500
    case 'Pending':
      return '#F59E0B'; // amber-500
    case 'Failed':
      return '#EF4444'; // red-500
    default:
      return '#6B7280'; // gray-500
  }
}


// src/lib/dpp-display-utils.ts
'use client';

import React from 'react';
import { CheckCircle, Clock, ShieldAlert } from 'lucide-react';

export function getStatusIcon(status: string | undefined) {
  switch (status) {
    case 'Verified':
 return <CheckCircle />;
    case 'Pending':
      return <Clock />;
    case 'Failed':
    default:
      return <ShieldAlert />;
  }
}

export function getStatusBadgeVariant(
  status: string | undefined,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Verified':
    case 'Cleared':
      return 'default';
    case 'Pending':
    case 'Detained':
      return 'secondary';
    case 'Failed':
    case 'Rejected':
      return 'destructive';
    default:
        return 'outline';
  }
}

export function getStatusBadgeClasses(status: string | undefined): string {
    switch (status) {
      case 'Verified':
      case 'Cleared':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
      case 'Pending':
      case 'Detained':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700';
      case 'Failed':
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
      default:
        return '';
    }
}

export function getFactoryColor(status: 'Active' | 'Idle' | 'Maintenance'): string {
  switch (status) {
    case 'Active':
      return '#22c55e'; // green-500
    case 'Maintenance':
      return '#ef4444'; // red-500
    case 'Idle':
    default:
      return '#f59e0b'; // amber-500
  }
}

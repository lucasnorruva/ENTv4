// src/lib/dppDisplayUtils.ts
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

'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface RelativeTimeProps {
  date: string | Date;
  className?: string;
}

export default function RelativeTime({ date, className }: RelativeTimeProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // On the server and for the initial client render, return a placeholder.
  // This can be styled to look like the final output to prevent layout shifts.
  if (!isClient) {
    return <span className={className}>...</span>;
  }

  // Once the component has mounted on the client, render the dynamic time.
  return (
    <span className={className}>
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  );
}

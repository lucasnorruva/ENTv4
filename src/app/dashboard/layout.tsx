// src/app/dashboard/layout.tsx
import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <p>Dashboard Layout</p>
      {children}
    </div>
  );
}

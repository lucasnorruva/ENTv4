import React from 'react';

// This layout will eventually contain the role-specific shell (sidebar, header).
export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}

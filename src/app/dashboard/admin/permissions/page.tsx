// src/app/dashboard/admin/permissions/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, XCircle } from 'lucide-react';
import { permissionMatrix, allActions } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const actionGroups = {
    'Product Management': allActions.filter(a => a.startsWith('product:') && !a.startsWith('product:approve') && !a.startsWith('product:reject') && !a.startsWith('product:resolve') && !a.startsWith('product:override_verification') && !a.startsWith('product:recycle') && !a.startsWith('product:add_service_record') && !a.startsWith('product:customs_inspect')),
    'Compliance & Auditing': allActions.filter(a => a.startsWith('compliance:') || a.startsWith('product:approve') || a.startsWith('product:reject') || a.startsWith('product:resolve') || a.startsWith('product:override_verification')),
    'Lifecycle & Service': allActions.filter(a => a.startsWith('product:recycle') || a.startsWith('product:add_service_record') || a.startsWith('ticket:') || a.startsWith('product:customs_inspect')),
    'User & Company': allActions.filter(a => a.startsWith('user:') || a.startsWith('company:')),
    'Developer & API': allActions.filter(a => a.startsWith('developer:') || a.startsWith('integration:sync')),
    'System Administration': allActions.filter(a => a.startsWith('admin:') || a.startsWith('support:')),
};

export default async function PermissionsPage() {
  const user = await getCurrentUser(UserRoles.ADMIN);

  if (!hasRole(user, UserRoles.ADMIN)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const roles = Object.values(UserRoles);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Matrix</CardTitle>
          <CardDescription>
            An overview of permissions for each user role on the platform. This is currently read-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="min-w-[250px] sticky left-0 bg-muted/50">Permission</TableHead>
                  {roles.map(role => (
                    <TableHead key={role} className="text-center min-w-[150px]">{role}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(actionGroups).map(([groupName, actions]) => (
                    <React.Fragment key={groupName}>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={roles.length + 1} className="font-semibold text-foreground sticky left-0 bg-muted/30">
                                {groupName}
                            </TableCell>
                        </TableRow>
                        {actions.map(action => (
                            <TableRow key={action}>
                                <TableCell className="font-mono text-xs sticky left-0 bg-background">{action}</TableCell>
                                {roles.map(role => (
                                <TableCell key={`${role}-${action}`} className="text-center">
                                    {permissionMatrix[role]?.includes(action) ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                    ) : (
                                    <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                                    )}
                                </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

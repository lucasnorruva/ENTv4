// src/app/dashboard/manufacturer/lines/page.tsx
import { redirect } from 'next/navigation';
import { getProductionLines } from '@/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Factory, Tag, Wrench } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserRoles } from '@/lib/constants';

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">{label}:</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

export default async function ProductionLinesPage() {
  const user = await getCurrentUser(UserRoles.MANUFACTURER);

  if (!hasRole(user, UserRoles.MANUFACTURER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const lines = await getProductionLines();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Maintenance':
        return 'destructive';
      case 'Idle':
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Production Lines</h1>
        <p className="text-muted-foreground">
          Monitor the status and output of all manufacturing lines.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lines.map(line => (
          <Card key={line.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{line.name}</CardTitle>
                <Badge variant={getStatusVariant(line.status)}>
                  {line.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2 pt-1">
                <Factory className="h-4 w-4" /> {line.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Stat
                icon={Tag}
                label="Current Product"
                value={line.currentProduct}
              />
              <Stat
                icon={Activity}
                label="Output"
                value={`${line.outputPerHour} units/hr`}
              />
              <Stat
                icon={Wrench}
                label="Last Maintenance"
                value={formatDistanceToNow(new Date(line.lastMaintenance), {
                  addSuffix: true,
                })}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

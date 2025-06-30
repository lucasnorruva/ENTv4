// src/app/dashboard/compliance/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { compliancePaths } from '@/lib/compliance-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileQuestion, ScrollText, Settings2 } from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compliance Path Management
        </h1>
        <p className="text-muted-foreground">
          View and manage the compliance standards and rule sets that products
          are verified against.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {compliancePaths.map(path => (
          <Card key={path.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{path.name}</CardTitle>
              <Badge variant="outline" className="w-fit">
                {path.category}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <p className="text-sm text-muted-foreground">
                {path.description}
              </p>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-muted-foreground" />
                  Regulations
                </h4>
                <div className="flex flex-wrap gap-1">
                  {path.regulations.map(reg => (
                    <Badge key={reg} variant="secondary">
                      {reg}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-muted-foreground" />
                  Rules
                </h4>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                  {JSON.stringify(path.rules, null, 2)}
                </pre>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                <Settings2 className="mr-2 h-4 w-4" />
                Manage Path (Soon)
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
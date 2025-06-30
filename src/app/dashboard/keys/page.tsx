// src/app/dashboard/keys/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

export default function ApiKeysPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Manage API keys for accessing the Norruva API. This feature is under
          construction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
          <KeyRound className="w-12 h-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            API Key management will be available here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

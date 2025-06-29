// src/components/dashboards/developer-dashboard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const mockApiLogs = [
  { timestamp: '2024-07-23T10:00:00Z', level: 'INFO', message: 'POST /api/products - 201 Created' },
  { timestamp: '2024-07-23T10:01:15Z', level: 'INFO', message: 'GET /api/products/pp-001 - 200 OK' },
  { timestamp: '2024-07-23T10:02:30Z', level: 'WARN', message: 'AI sustainability check for pp-003 took 3.5s' },
  { timestamp: '2024-07-23T10:05:00Z', level: 'INFO', 'message': 'CRON /api/cron - Verification job started.'},
  { timestamp: '2024-07-23T10:05:45Z', level: 'ERROR', message: 'Failed to connect to blockchain anchoring service.' },
];

export default function DeveloperDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer Dashboard</CardTitle>
        <CardDescription>
          Monitor API logs, system health, and manage integrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">Real-time API Logs</h3>
        <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/50">
          <div className="font-mono text-xs">
            {mockApiLogs.map((log, index) => (
                <div key={index} className="flex gap-4">
                    <span className="text-muted-foreground">{log.timestamp}</span>
                    <span className={log.level === 'ERROR' ? 'text-destructive' : 'text-primary'}>[{log.level}]</span>
                    <span>{log.message}</span>
                </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

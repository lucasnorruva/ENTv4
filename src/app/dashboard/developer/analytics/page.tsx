// src/app/dashboard/developer/analytics/page.tsx
import { redirect } from 'next/navigation';
import { getAuditLogs } from '@/lib/actions/audit-actions';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/auth-utils';
import { UserRoles } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { subDays, format } from 'date-fns';
import ApiUsageChart from '@/components/charts/api-usage-chart';
import ApiErrorRateChart from '@/components/charts/api-error-rate-chart';
import TopEndpointsChart from '@/components/charts/top-endpoints-chart';

export default async function ApiAnalyticsPage() {
  const user = await getCurrentUser(UserRoles.DEVELOPER);

  if (!hasRole(user, UserRoles.DEVELOPER)) {
    redirect(`/dashboard/${user.roles[0].toLowerCase().replace(/ /g, '-')}`);
  }

  const allLogs = await getAuditLogs();
  // For this mock, we assume the developer can see all API logs.
  // In a real app, this would be scoped to their company's API keys.
  const apiLogs = allLogs.filter(log => log.action.startsWith('api.'));

  // --- Aggregate Data ---

  // 1. Total requests in last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentLogs = apiLogs.filter(
    log => new Date(log.createdAt) >= thirtyDaysAgo,
  );

  // 2. Success vs Error Rate
  const successCount = recentLogs.filter(
    log => log.details.status >= 200 && log.details.status < 300,
  ).length;
  const errorCount = recentLogs.length - successCount;
  const errorRate =
    recentLogs.length > 0 ? (errorCount / recentLogs.length) * 100 : 0;
  const errorRateData = { success: successCount, errors: errorCount };

  // 3. Average Latency
  const logsWithLatency = recentLogs.filter(log => log.details.latencyMs);
  const avgLatency =
    logsWithLatency.length > 0
      ? Math.round(
          logsWithLatency.reduce(
            (sum, log) => sum + log.details.latencyMs,
            0,
          ) / logsWithLatency.length,
        )
      : 0;

  // 4. API Usage over time
  const usageByDay = recentLogs.reduce(
    (acc, log) => {
      const date = format(new Date(log.createdAt), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const usageData = Object.entries(usageByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 5. Top Endpoints
  const endpointCounts = recentLogs.reduce(
    (acc, log) => {
      const endpointKey = `${log.details.method} ${log.details.endpoint}`;
      acc[endpointKey] = (acc[endpointKey] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const topEndpointsData = Object.entries(endpointCounts)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Analytics</h1>
        <p className="text-muted-foreground">
          Usage and performance metrics for your API integrations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests (30d)
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Total API calls in the last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Error Rate (30d)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {errorCount} failed requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Latency (30d)
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLatency}ms</div>
            <p className="text-xs text-muted-foreground">
              Average API response time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Successful Requests (30d)
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successCount}</div>
            <p className="text-xs text-muted-foreground">
              Requests with 2xx status codes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Requests Over Time</CardTitle>
          <CardDescription>
            Volume of API calls made in the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiUsageChart data={usageData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Endpoints</CardTitle>
            <CardDescription>
              Most frequently called API endpoints in the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopEndpointsChart data={topEndpointsData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success vs. Error Rate</CardTitle>
            <CardDescription>
              A breakdown of all API requests by status code type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiErrorRateChart data={errorRateData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

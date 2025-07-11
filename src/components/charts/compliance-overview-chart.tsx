// src/components/charts/compliance-overview-chart.tsx
"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface ChartData {
  verified: number;
  pending: number;
  failed: number;
}

const chartConfig = {
  verified: {
    label: "Verified",
    color: "hsl(var(--chart-2))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-4))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--destructive))",
  },
};

export default function ComplianceOverviewChart({ data }: { data: ChartData }) {
  const chartData = [
    {
      status: "Compliance",
      verified: data.verified,
      pending: data.pending,
      failed: data.failed,
    },
  ];

  const total = data.verified + data.pending + data.failed;
  if (total === 0) {
    return (
      <div className="flex justify-center items-center h-[200px] text-muted-foreground text-sm">
        No product data available.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 10, right: 10 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="status"
          type="category"
          tickLine={false}
          axisLine={false}
          tick={false}
        />
        <XAxis dataKey="value" type="number" hide />
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Legend />
        <Bar
          dataKey="verified"
          stackId="a"
          fill="var(--color-verified)"
          radius={[4, 4, 0, 0]}
        />
        <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" />
        <Bar
          dataKey="failed"
          stackId="a"
          fill="var(--color-failed)"
          radius={[0, 0, 4, 4]}
        />
      </BarChart>
    </ChartContainer>
  );
}

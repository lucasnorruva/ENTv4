// src/components/charts/customs-status-chart.tsx
"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartData {
  cleared: number;
  detained: number;
  rejected: number;
}

const chartConfig = {
  cleared: {
    label: "Cleared",
    color: "hsl(var(--chart-2))",
  },
  detained: {
    label: "Detained",
    color: "hsl(var(--chart-4))",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export default function CustomsStatusChart({ data }: { data: ChartData }) {
  const chartData = [
    { status: "cleared", count: data.cleared, fill: "var(--color-cleared)" },
    {
      status: "detained",
      count: data.detained,
      fill: "var(--color-detained)",
    },
    {
      status: "rejected",
      count: data.rejected,
      fill: "var(--color-rejected)",
    },
  ];

  const total = data.cleared + data.detained + data.rejected;

  if (total === 0) {
    return (
      <div className="flex justify-center items-center h-[250px] text-muted-foreground text-sm">
        No inspection data available.
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square h-[250px] w-full"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="count" />} />
        <Pie data={chartData} dataKey="count" nameKey="status" />
        <ChartLegend
          content={<ChartLegendContent nameKey="status" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
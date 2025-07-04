// src/components/charts/production-line-status-chart.tsx
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
  active: number;
  idle: number;
  maintenance: number;
}

const chartConfig = {
  active: {
    label: "Active",
    color: "hsl(var(--chart-2))",
  },
  idle: {
    label: "Idle",
    color: "hsl(var(--chart-4))",
  },
  maintenance: {
    label: "Maintenance",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export default function ProductionLineStatusChart({ data }: { data: ChartData }) {
  const chartData = [
    { status: "active", count: data.active, fill: "var(--color-active)" },
    {
      status: "idle",
      count: data.idle,
      fill: "var(--color-idle)",
    },
    {
      status: "maintenance",
      count: data.maintenance,
      fill: "var(--color-maintenance)",
    },
  ];
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

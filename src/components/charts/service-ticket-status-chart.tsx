
// src/components/charts/service-ticket-status-chart.tsx
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
  open: number;
  inProgress: number;
  closed: number;
}

const chartConfig = {
  open: {
    label: "Open",
    color: "hsl(var(--destructive))",
  },
  inProgress: {
    label: "In Progress",
    color: "hsl(var(--chart-4))",
  },
  closed: {
    label: "Closed",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function ServiceTicketStatusChart({ data }: { data: ChartData }) {
  const chartData = [
    { status: "open", count: data.open, fill: "var(--color-open)" },
    {
      status: "inProgress",
      count: data.inProgress,
      fill: "var(--color-inProgress)",
    },
    {
      status: "closed",
      count: data.closed,
      fill: "var(--color-closed)",
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

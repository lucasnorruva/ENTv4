// src/components/charts/eol-status-chart.tsx
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
  recycled: number;
  disposed: number;
}

const chartConfig = {
  active: {
    label: "Active",
    color: "hsl(var(--chart-4))",
  },
  recycled: {
    label: "Recycled",
    color: "hsl(var(--chart-2))",
  },
  disposed: {
    label: "Disposed",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export default function EolStatusChart({ data }: { data: ChartData }) {
  const chartData = [
    { browser: "active", count: data.active, fill: "var(--color-active)" },
    {
      browser: "recycled",
      count: data.recycled,
      fill: "var(--color-recycled)",
    },
    {
      browser: "disposed",
      count: data.disposed,
      fill: "var(--color-disposed)",
    },
  ];
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square h-[250px] w-full"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="count" />} />
        <Pie data={chartData} dataKey="count" nameKey="browser" />
        <ChartLegend
          content={<ChartLegendContent nameKey="browser" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}

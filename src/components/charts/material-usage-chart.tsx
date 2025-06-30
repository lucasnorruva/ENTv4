// src/components/charts/material-usage-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartData {
  material: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "Usage Count",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function MaterialUsageChart({ data }: { data: ChartData[] }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 20, right: 20 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="material"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="text-xs"
          width={100}
        />
        <XAxis dataKey="count" type="number" hide />
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} layout="vertical" />
      </BarChart>
    </ChartContainer>
  );
}

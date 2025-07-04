// src/components/charts/production-output-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartData {
  name: string;
  output: number;
}

const chartConfig = {
  output: {
    label: "Output (units/hr)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function ProductionOutputChart({ data }: { data: ChartData[] }) {
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
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="text-xs truncate"
          width={120}
        />
        <XAxis dataKey="output" type="number" hide />
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="output"
          fill="var(--color-output)"
          radius={4}
          layout="vertical"
        />
      </BarChart>
    </ChartContainer>
  );
}

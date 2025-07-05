// src/components/charts/failures-by-regulation-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartData {
  regulation: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "Failure Count",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export default function FailuresByRegulationChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-[300px] text-muted-foreground text-sm">
        No compliance failure data available.
      </div>
    );
  }
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
          dataKey="regulation"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="text-xs truncate"
          width={120}
        />
        <XAxis dataKey="count" type="number" hide />
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={4}
          layout="vertical"
        />
      </BarChart>
    </ChartContainer>
  );
}

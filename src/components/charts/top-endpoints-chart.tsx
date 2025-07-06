// src/components/charts/top-endpoints-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartData {
  endpoint: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "Requests",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function TopEndpointsChart({ data }: { data: ChartData[] }) {
    if (data.length === 0) {
        return (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground text-sm">
            No API request data available.
          </div>
        );
      }
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 10, right: 10 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis dataKey="count" type="number" hide />
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={4}
          layout="vertical"
        >
          {data.map((entry, index) => (
            <text
              key={`label-${index}`}
              x={15}
              y={index * (300 / data.length) + (300 / data.length) / 2}
              dy={5}
              fill="hsl(var(--foreground))"
              className="text-xs font-mono"
            >
              {entry.endpoint}
            </text>
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

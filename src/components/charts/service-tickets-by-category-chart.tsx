
// src/components/charts/service-tickets-by-category-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartData {
  category: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "Ticket Count",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function ServiceTicketsByCategoryChart({
  data,
}: {
  data: ChartData[];
}) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{
          left: 10,
          right: 10,
          top: 10,
          bottom: 10,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="text-xs"
        />
        <YAxis />
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

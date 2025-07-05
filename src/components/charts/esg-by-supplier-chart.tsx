// src/components/charts/esg-by-supplier-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartData {
  supplier: string;
  averageScore: number;
}

const chartConfig = {
  averageScore: {
    label: "Average ESG Score",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function EsgBySupplierChart({ data }: { data: ChartData[] }) {
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
          dataKey="supplier"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="text-xs truncate"
          width={120}
        />
        <XAxis dataKey="averageScore" type="number" hide />
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="averageScore"
          fill="var(--color-averageScore)"
          radius={4}
          layout="vertical"
        />
      </BarChart>
    </ChartContainer>
  );
}

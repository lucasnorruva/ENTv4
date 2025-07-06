// src/components/charts/api-error-rate-chart.tsx
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
  success: number;
  errors: number;
}

const chartConfig = {
  success: {
    label: "Success (2xx)",
    color: "hsl(var(--chart-2))",
  },
  errors: {
    label: "Error (4xx/5xx)",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export default function ApiErrorRateChart({ data }: { data: ChartData }) {
  const chartData = [
    { type: "success", count: data.success, fill: "var(--color-success)" },
    { type: "errors", count: data.errors, fill: "var(--color-errors)" },
  ];
  
  const total = data.success + data.errors;
  
  if (total === 0) {
    return (
      <div className="flex justify-center items-center h-[250px] text-muted-foreground text-sm">
        No API request data available.
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
        <Pie data={chartData} dataKey="count" nameKey="type" />
        <ChartLegend
          content={<ChartLegendContent nameKey="type" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}

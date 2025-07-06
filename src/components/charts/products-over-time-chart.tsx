// src/components/charts/products-over-time-chart.tsx
"use client";

import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartData {
  date: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "Products",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function ProductsOverTimeChart({
  data,
}: {
  data: ChartData[];
}) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="min-h-[200px] w-full" />;
  }
  
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }}
        />
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Line
          dataKey="count"
          type="monotone"
          stroke="var(--color-count)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

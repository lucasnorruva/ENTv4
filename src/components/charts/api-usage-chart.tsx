// src/components/charts/api-usage-chart.tsx
"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip } from "recharts";
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
    label: "Requests",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function ApiUsageChart({
  data,
}: {
  data: ChartData[];
}) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="min-h-[300px] w-full" />;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <AreaChart
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
        <Area
          dataKey="count"
          type="natural"
          fill="var(--color-count)"
          fillOpacity={0.4}
          stroke="var(--color-count)"
        />
      </AreaChart>
    </ChartContainer>
  );
}

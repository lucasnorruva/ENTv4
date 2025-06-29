// src/components/charts/sustainability-by-category-chart.tsx
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ChartData {
    category: string;
    averageScore: number;
}

const chartConfig = {
  averageScore: {
    label: 'Average Score',
    color: 'hsl(var(--chart-1))',
  },
};

export default function SustainabilityByCategoryChart({ data }: { data: ChartData[] }) {
  return (
     <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart 
        data={data}
        margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis />
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="averageScore" fill="var(--color-averageScore)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

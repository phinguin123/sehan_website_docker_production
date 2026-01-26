import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BarChart = ({ data, dataKeys = [], colors = [], height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart 
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        barGap={8}
        barCategoryGap="20%"
      >
        <CartesianGrid 
          strokeDasharray="0" 
          stroke="hsl(var(--border))" 
          vertical={false}
          opacity={0.5}
        />
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          dy={10}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          domain={[0, 100]}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
          iconSize={10}
        />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index] || `hsl(${index * 60}, 70%, 50%)`}
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const DoughnutChart = ({ data, colors = [], height = 300 }) => {
  // Total is used for percentage calculation in the tooltip
  const total = Array.isArray(data)
    ? data.reduce((sum, entry) => sum + (entry?.value || 0), 0)
    : 0;

  const renderCustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const { name, value } = payload[0]?.payload || {};
    const percentage = total ? ((value / total) * 100).toFixed(1) : 0;

    return (
      <div
        style={{
          padding: "8px 10px",
          backgroundColor: "hsl(var(--popover))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          color: "hsl(var(--foreground))",
          fontSize: "0.875rem",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{name}</div>
        <div>Count: {value}</div>
        <div>Percentage: {percentage}%</div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="value"
          label={false}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index] || `hsl(${index * 72}, 70%, 50%)`}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={renderCustomTooltip} />
        <Legend 
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ paddingTop: '10px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DoughnutChart;

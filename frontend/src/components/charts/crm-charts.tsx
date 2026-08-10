'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#ef4444'];

interface PipelineChartProps {
  data: { stage: string; value: number }[];
}

export function PipelineBarChart({ data }: PipelineChartProps) {
  const chartData = data.length > 0 ? data : [
    { stage: 'NEW', value: 45000 },
    { stage: 'QUALIFIED', value: 85000 },
    { stage: 'PROPOSAL', value: 120000 },
    { stage: 'NEGOTIATION', value: 95000 },
    { stage: 'WON', value: 150000 },
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
            formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, 'Pipeline Value']}
          />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LeadPieChartProps {
  data: { status: string; count: number }[];
}

export function LeadStatusPieChart({ data }: LeadPieChartProps) {
  const chartData = data.length > 0 ? data : [
    { status: 'NEW', count: 35 },
    { status: 'CONTACTED', count: 28 },
    { status: 'QUALIFIED', count: 18 },
    { status: 'CONVERTED', count: 12 },
    { status: 'LOST', count: 7 },
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={5}
            dataKey="count"
            nameKey="status"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

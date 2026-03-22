import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { formatChannel } from './utils';

const COLORS = ['#00A3FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface ChannelChartProps {
  data: { channel: string; count: number }[];
}

export default function ChannelChart({ data }: ChannelChartProps) {
  const chartData = data.map((d) => ({ name: formatChannel(d.channel), value: d.count }));

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Channel Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

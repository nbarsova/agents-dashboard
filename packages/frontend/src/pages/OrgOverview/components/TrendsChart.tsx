import type { TrendPoint } from '@template/shared';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TrendsChartProps {
  data: TrendPoint[];
}

export default function TrendsChart({ data }: TrendsChartProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Usage Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          />
          <YAxis yAxisId="runs" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="tokens" orientation="right" tick={{ fontSize: 11 }} />
          <Tooltip
            labelFormatter={(v) => new Date(v as string).toLocaleDateString()}
            formatter={(value, name) => [
              name === 'tokens' ? Number(value).toLocaleString() : String(value),
              name === 'tokens' ? 'Tokens' : 'Runs',
            ]}
          />
          <Line
            yAxisId="runs"
            type="monotone"
            dataKey="runs"
            stroke="#00A3FF"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="tokens"
            type="monotone"
            dataKey="tokens"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

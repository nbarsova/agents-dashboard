import type { TrendPoint } from '@template/shared';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { aggregateByWeekday } from './utils';

interface WeekdayChartProps {
  data: TrendPoint[];
}

export default function WeekdayChart({ data }: WeekdayChartProps) {
  const weekdayData = aggregateByWeekday(data);

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Runs by Weekday</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={weekdayData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Runs']} />
          <Bar dataKey="runs" fill="#00629D" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

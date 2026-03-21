interface SessionGaugeProps {
  used: number;
  limit: number;
  percentage: number;
}

export default function SessionGauge({ used, limit, percentage }: SessionGaugeProps) {
  const barColor =
    percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-alert' : 'bg-primary';

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <p className="text-sm text-text-secondary">Session Usage</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">
        {used} / {limit}
      </p>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-bg-alt">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-text-secondary">{percentage.toFixed(1)}% of session limit</p>
    </div>
  );
}

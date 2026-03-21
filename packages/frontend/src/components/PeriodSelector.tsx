const PERIODS = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-white p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            value === p.value
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-bg-alt'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

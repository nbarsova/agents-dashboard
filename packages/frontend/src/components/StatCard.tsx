interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>}
    </div>
  );
}

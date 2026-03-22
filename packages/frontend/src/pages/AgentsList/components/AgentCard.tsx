import type { AgentWithStats } from '@template/shared';

interface AgentCardProps {
  item: AgentWithStats;
  onClick: () => void;
}

export default function AgentCard({ item, onClick }: AgentCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-border bg-white p-5 hover:border-primary/40 hover:shadow-sm"
    >
      <h3 className="text-sm font-semibold text-text-primary">{item.agent.name}</h3>
      {item.agent.description && (
        <p className="mt-1 text-xs text-text-secondary">{item.agent.description}</p>
      )}
      <div className="mt-3 flex gap-4">
        <span className="text-xs text-text-secondary">
          <span className="font-medium text-text-primary">{item.totalRuns.toLocaleString()}</span>{' '}
          runs
        </span>
        <span className="text-xs text-text-secondary">
          <span className="font-medium text-text-primary">
            {item.totalTokens.toLocaleString()}
          </span>{' '}
          tokens
        </span>
      </div>
    </div>
  );
}

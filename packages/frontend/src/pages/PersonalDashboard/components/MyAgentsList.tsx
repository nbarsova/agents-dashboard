import type { Agent } from '@template/shared';

interface MyAgentsListProps {
  agents: { agent: Pick<Agent, 'id' | 'name'>; runs: number }[];
  orgId: string;
}

export default function MyAgentsList({ agents, orgId }: MyAgentsListProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">My Agents</h3>
      <div className="flex flex-col gap-2">
        {agents.map((item) => (
          <a
            key={item.agent.id}
            href={`/orgs/${orgId}/agents/${item.agent.id}`}
            className="flex items-center justify-between rounded px-3 py-2 hover:bg-bg-alt"
          >
            <span className="text-sm text-text-primary">{item.agent.name}</span>
            <span className="text-xs text-text-secondary">{item.runs} runs</span>
          </a>
        ))}
        {agents.length === 0 && (
          <p className="text-sm text-text-secondary">No agent usage in this period</p>
        )}
      </div>
    </div>
  );
}

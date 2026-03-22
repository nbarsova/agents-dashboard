import { useNavigate } from 'react-router-dom';

interface MyAgent {
  agent: { id: string; name: string };
  runs: number;
}

interface MyAgentsListProps {
  agents: MyAgent[];
  orgId: string;
}

export default function MyAgentsList({ agents, orgId }: MyAgentsListProps) {
  const navigate = useNavigate();

  if (agents.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">My Agents</h3>
      <div className="grid grid-cols-3 gap-3">
        {agents.map(({ agent, runs }) => (
          <div
            key={agent.id}
            onClick={() => navigate(`/orgs/${orgId}/agents/${agent.id}`)}
            className="cursor-pointer rounded-lg border border-border p-3 hover:border-primary/40 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-text-primary">{agent.name}</p>
            <p className="mt-1 text-xs text-text-secondary">
              <span className="font-medium text-text-primary">{runs.toLocaleString()}</span>{' '}
              {runs === 1 ? 'run' : 'runs'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

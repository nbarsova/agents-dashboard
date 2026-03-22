import type { AgentWithStats } from '@template/shared';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getAgents } from '../../api/analytics';
import AgentCard from './components/AgentCard';

export default function AgentsList() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    getAgents(orgId)
      .then(setAgents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="text-text-secondary">Loading agents...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">Agents</h1>
      {agents.length === 0 ? (
        <p className="text-sm text-text-secondary">No agents found in this organization.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {agents.map((item) => (
            <AgentCard
              key={item.agent.id}
              item={item}
              onClick={() => navigate(`/orgs/${orgId}/agents/${item.agent.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import type { OrgOverview as OrgOverviewData } from '@template/shared';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getOrgOverview } from '../../api/analytics';
import PeriodSelector from '../../components/PeriodSelector';
import StatCard from '../../components/StatCard';
import ChannelChart from './components/ChannelChart';
import TopList from './components/TopList';
import TrendsChart from './components/TrendsChart';

export default function OrgOverview() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<OrgOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    getOrgOverview(orgId, period)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId, period]);

  if (loading) {
    return <div className="text-text-secondary">Loading overview...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!data) return null;

  const topAgentItems = data.topAgents.map((a) => ({
    id: a.agent.id,
    name: a.agent.name,
    runs: a.runs,
    tokens: a.tokens,
  }));

  const topUserItems = data.topUsers.map((u) => ({
    id: u.user.id,
    name: u.user.name,
    runs: u.runs,
    tokens: u.tokens,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Organization Overview</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Runs" value={data.totalRuns.toLocaleString()} />
        <StatCard label="Total Tokens" value={data.totalTokens.toLocaleString()} />
        <StatCard
          label="Estimated Cost"
          value={data.totalCost !== null ? `$${data.totalCost.toFixed(2)}` : 'N/A (seat plan)'}
        />
      </div>

      <TrendsChart data={data.trends} />
      <ChannelChart data={data.channelBreakdown} />

      <div className="grid grid-cols-2 gap-4">
        <TopList
          title="Top Agents"
          items={topAgentItems}
          onItemClick={(agentId) => navigate(`/orgs/${orgId}/agents/${agentId}`)}
        />
        <TopList title="Top Users" items={topUserItems} />
      </div>
    </div>
  );
}

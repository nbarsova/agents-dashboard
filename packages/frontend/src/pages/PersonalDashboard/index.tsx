import type { PersonalAnalytics } from '@template/shared';
import { useEffect, useState } from 'react';

import { getPersonalAnalytics } from '../../api/analytics';
import PeriodSelector from '../../components/PeriodSelector';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';
import RecentRunsList from './components/RecentRunsList';
import SessionGauge from './components/SessionGauge';

export default function PersonalDashboard() {
  const { defaultOrgId, memberships } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<PersonalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const orgId = defaultOrgId;
  const currentOrg = memberships.find((m) => m.orgId === orgId);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    getPersonalAnalytics(orgId, period)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId, period]);

  if (loading) return <div className="text-text-secondary">Loading your dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data || !orgId) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Recent Runs</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="My Runs" value={data.totalRuns.toLocaleString()} />
        <StatCard label="My Tokens" value={data.totalTokens.toLocaleString()} />
        {data.cost !== null ? (
          <StatCard label="My Cost" value={`$${data.cost.toFixed(2)}`} />
        ) : (
          <div />
        )}
      </div>

      {data.sessionUsage && (
        <SessionGauge
          used={data.sessionUsage.used}
          limit={data.sessionUsage.limit}
          percentage={data.sessionUsage.percentage}
        />
      )}

      <RecentRunsList runs={data.recentRuns} />

      {currentOrg && (
        <p className="text-xs text-text-secondary">
          Organization: {currentOrg.org.name} ({currentOrg.org.pricingPlan} plan)
        </p>
      )}
    </div>
  );
}

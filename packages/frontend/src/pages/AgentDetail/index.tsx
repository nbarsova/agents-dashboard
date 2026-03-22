import type { AgentDetail as AgentDetailData } from '@template/shared';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getAgentDetail } from '../../api/analytics';
import PeriodSelector from '../../components/PeriodSelector';
import StatCard from '../../components/StatCard';
import RunRow from './components/RunRow';

export default function AgentDetail() {
  const { orgId, agentId } = useParams<{ orgId: string; agentId: string }>();
  const [period, setPeriod] = useState('30d');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AgentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orgId || !agentId) return;
    setLoading(true);
    getAgentDetail(orgId, agentId, period, page, 50)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId, agentId, period, page]);

  if (loading) return <div className="text-text-secondary">Loading agent details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return null;

  const { agent, summary, runs, kpis } = data;
  const totalPages = Math.ceil(runs.total / runs.limit);

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/orgs/${orgId}/agents`}
        className="text-sm text-text-secondary hover:text-primary"
      >
        &larr; Back to Agents
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{agent.name}</h1>
          {agent.description && (
            <p className="mt-1 text-sm text-text-secondary">{agent.description}</p>
          )}
        </div>
        <PeriodSelector value={period} onChange={(p) => { setPeriod(p); setPage(1); }} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Runs" value={summary.totalRuns.toLocaleString()} />
        <StatCard label="Total Tokens" value={summary.totalTokens.toLocaleString()} />
        <StatCard label="Avg Duration" value={`${(summary.avgDurationMs / 1000).toFixed(1)}s`} />
        <StatCard
          label="Success Rate"
          value={`${(summary.successRate * 100).toFixed(1)}%`}
        />
      </div>

      {kpis.length > 0 && (
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Linked KPIs</h3>
          <div className="flex flex-wrap gap-3">
            {kpis.map((kpi) => {
              const targetNum = parseFloat(String(kpi.target ?? '').replace(/[^0-9.]/g, ''));
              const currentNum = parseFloat(String(kpi.currentValue ?? ''));
              const hasProgress = !isNaN(targetNum) && targetNum > 0 && !isNaN(currentNum);
              const ratio = hasProgress ? currentNum / targetNum : 0;
              const progressColor = ratio >= 0.8
                ? 'bg-success'
                : ratio >= 0.5
                  ? 'bg-alert'
                  : 'bg-red-500';

              return (
                <div key={kpi.id} className="min-w-48 rounded border border-border px-4 py-3">
                  <p className="text-sm font-medium text-text-primary">{kpi.name}</p>
                  <div className="mt-2 flex gap-6 text-xs text-text-secondary">
                    <span>Target: <span className="font-medium text-text-primary">{kpi.target ?? '—'}</span></span>
                    <span>Current: <span className="font-medium text-text-primary">{kpi.currentValue ?? '—'}</span></span>
                  </div>
                  {hasProgress && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-alt">
                      <div
                        className={`h-full rounded-full ${progressColor}`}
                        style={{ width: `${Math.min(100, ratio * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Runs ({runs.total.toLocaleString()})
          </h3>
        </div>
        <div className="flex items-center gap-4 border-b border-border bg-bg-alt px-4 py-2 text-xs font-medium text-text-secondary">
          <span className="w-4" />
          <span className="w-40">Timestamp</span>
          <span className="w-36">User</span>
          <span className="w-44">Project</span>
          <span className="w-16 text-center">Channel</span>
          <span className="w-24 text-right">Tokens</span>
          <span className="w-20 text-right">Duration</span>
          <span className="w-16 text-center">Status</span>
          <span className="w-16 text-center">Tools</span>
        </div>
        {runs.data.map((run) => (
          <RunRow key={run.id} run={run} />
        ))}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-3">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded px-3 py-1 text-sm text-text-secondary hover:bg-bg-alt disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-sm text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded px-3 py-1 text-sm text-text-secondary hover:bg-bg-alt disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

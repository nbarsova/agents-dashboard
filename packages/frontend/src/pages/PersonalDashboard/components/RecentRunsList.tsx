import type { AgentRunWithDetails } from '@template/shared';

interface RecentRunsListProps {
  runs: AgentRunWithDetails[];
}

function statusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'text-success';
    case 'failure':
      return 'text-red-500';
    case 'timeout':
      return 'text-alert';
    default:
      return 'text-text-secondary';
  }
}

export default function RecentRunsList({ runs }: RecentRunsListProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Recent Runs</h3>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left text-xs text-text-secondary">
            <th className="pb-2 font-medium">Agent</th>
            <th className="pb-2 font-medium">Project</th>
            <th className="pb-2 font-medium">Time</th>
            <th className="pb-2 text-right font-medium">Tokens</th>
            <th className="pb-2 text-right font-medium">Status</th>
            <th className="pb-2 text-right font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-b border-border last:border-b-0">
              <td className="py-2 text-sm text-text-primary">{run.agent.name}</td>
              <td className="py-2 text-xs text-text-secondary">{run.project?.name ?? '—'}</td>
              <td className="py-2 text-xs text-text-secondary">
                {new Date(run.createdAt).toLocaleString()}
              </td>
              <td className="py-2 text-right text-sm text-text-primary">
                {run.tokensUsed.toLocaleString()}
              </td>
              <td className={`py-2 text-right text-xs ${statusColor(run.status)}`}>{run.status}</td>
              <td className="py-2 text-right text-xs text-text-secondary">
                {(run.durationMs / 1000).toFixed(1)}s
              </td>
            </tr>
          ))}
          {runs.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-sm text-text-secondary">
                No recent runs
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import type { AgentRunWithDetails } from '@template/shared';
import { useState } from 'react';

interface RunRowProps {
  run: AgentRunWithDetails;
}

function formatChannel(channel: string): string {
  if (channel.startsWith('integration:')) return channel.split(':')[1];
  if (channel.startsWith('web:custom:')) return channel.split(':')[2];
  return channel.toUpperCase();
}

function statusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-success/10 text-success';
    case 'failure':
      return 'bg-red-100 text-red-600';
    case 'timeout':
      return 'bg-alert/10 text-alert';
    default:
      return 'bg-bg-alt text-text-secondary';
  }
}

export default function RunRow({ run }: RunRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-bg-alt"
      >
        <span className="w-4 text-xs text-text-secondary">{expanded ? '▾' : '▸'}</span>
        <span className="w-40 text-xs text-text-secondary">
          {new Date(run.createdAt).toLocaleString()}
        </span>
        <span className="w-36 truncate text-sm text-text-primary">{run.user.name}</span>
        <span className="w-44 truncate text-sm text-text-secondary">
          {run.project?.name ?? '—'}
        </span>
        <span className="w-16 text-center text-xs">
          <span className="rounded bg-bg-alt px-2 py-0.5 text-text-secondary">
            {formatChannel(run.invocationChannel)}
          </span>
        </span>
        <span className="w-24 text-right text-sm text-text-primary">
          {run.tokensUsed.toLocaleString()}
        </span>
        <span className="w-20 text-right text-xs text-text-secondary">
          {(run.durationMs / 1000).toFixed(1)}s
        </span>
        <span className={`w-16 rounded px-2 py-0.5 text-center text-xs ${statusColor(run.status)}`}>
          {run.status}
        </span>
        <span className="w-16 text-center text-xs text-text-secondary">
          {run.toolCallCount} tools
        </span>
      </div>
      {expanded && run.toolCallBreakdown.length > 0 && (
        <div className="bg-bg-alt px-12 py-2">
          <p className="mb-1 text-xs font-medium text-text-secondary">Tool Calls</p>
          <div className="flex flex-wrap gap-2">
            {run.toolCallBreakdown.map((tc) => (
              <span
                key={tc.toolName}
                className="rounded bg-white px-2 py-1 text-xs text-text-primary"
              >
                {tc.toolName}: {tc.count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

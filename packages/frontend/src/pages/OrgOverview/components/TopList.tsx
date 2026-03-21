import { useState } from 'react';

const INITIAL_COUNT = 5;

interface TopListItem {
  id: string;
  name: string;
  runs: number;
  tokens: number;
}

interface TopListProps {
  title: string;
  items: TopListItem[];
  onItemClick?: (id: string) => void;
}

export default function TopList({ title, items, onItemClick }: TopListProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > INITIAL_COUNT;
  const visibleItems = expanded ? items : items.slice(0, INITIAL_COUNT);

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">{title}</h3>
      <div className="flex flex-col gap-2">
        {visibleItems.map((item, i) => (
          <div
            key={item.id}
            onClick={() => onItemClick?.(item.id)}
            className={`flex items-center justify-between rounded px-3 py-2 ${
              onItemClick ? 'cursor-pointer hover:bg-bg-alt' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-alt text-xs font-medium text-text-secondary">
                {i + 1}
              </span>
              <span className="text-sm text-text-primary">{item.name}</span>
            </div>
            <div className="flex gap-4 text-xs text-text-secondary">
              <span>{item.runs.toLocaleString()} runs</span>
              <span>{item.tokens.toLocaleString()} tokens</span>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full rounded py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-alt"
        >
          {expanded ? 'Show less' : `Show all (${items.length})`}
        </button>
      )}
    </div>
  );
}

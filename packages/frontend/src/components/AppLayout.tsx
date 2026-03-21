import { Link, Outlet, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, memberships, logout, defaultOrgId } = useAuth();
  const { orgId } = useParams();
  const currentOrgId = orgId || defaultOrgId;

  const currentOrg = memberships.find((m) => m.orgId === currentOrgId);
  const isAdmin = currentOrg?.role === 'admin';

  return (
    <div className="flex h-screen flex-col bg-bg-main">
      <nav className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to={currentOrgId ? `/orgs/${currentOrgId}/overview` : '/'} className="text-lg font-bold text-text-primary">
            Agents Analytics
          </Link>
          {currentOrgId && isAdmin && (
            <Link
              to={`/orgs/${currentOrgId}/overview`}
              className="text-sm text-text-secondary hover:text-primary"
            >
              Organization Overview
            </Link>
          )}
          <Link to="/me/analytics" className="text-sm text-text-secondary hover:text-primary">
            My Usage
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {memberships.length > 1 && (
            <select
              className="rounded border border-border bg-white px-2 py-1 text-sm"
              value={currentOrgId || ''}
              onChange={(e) => {
                window.location.href = `/orgs/${e.target.value}/overview`;
              }}
            >
              {memberships.map((m) => (
                <option key={m.orgId} value={m.orgId}>
                  {m.org.name}
                </option>
              ))}
            </select>
          )}
          {currentOrg && (
            <span className="text-xs text-text-secondary">
              {currentOrg.org.name}
              {isAdmin && (
                <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                  admin
                </span>
              )}
            </span>
          )}
          <span className="text-sm text-text-secondary">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-text-secondary hover:text-red-500"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

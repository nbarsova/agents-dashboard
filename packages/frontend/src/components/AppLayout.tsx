import { Link, Outlet, useLocation, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, memberships, logout, defaultOrgId } = useAuth();
  const { orgId } = useParams();
   const currentOrgId = orgId || defaultOrgId;

  const { pathname } = useLocation();
  const currentOrg = memberships.find((m) => m.orgId === currentOrgId);
  const isAdmin = currentOrg?.role === 'admin';

  const overviewPath = `/orgs/${currentOrgId}/overview`;
  const isOverviewActive = pathname.startsWith(overviewPath);
  const isAgentsActive = pathname.startsWith(`/orgs/${currentOrgId}/agents`);
  const isMyUsageActive = pathname.startsWith('/me/analytics');

  return (
    <div className="flex h-screen flex-col bg-bg-main">
      <nav className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <Link
            to={isAdmin ? `/orgs/${currentOrgId}/overview` : '/'}
            className="text-lg font-bold text-text-primary"
          >
            Agents Analytics
          </Link>
          {currentOrgId && isAdmin && (
            <Link
              to={`/orgs/${currentOrgId}/overview`}
              className={`text-sm ${isOverviewActive ? 'font-medium text-primary' : 'text-text-secondary hover:text-primary'}`}
            >
              Organization Overview
            </Link>
          )}
          {currentOrgId && (
            <Link
              to={`/orgs/${currentOrgId}/agents`}
              className={`text-sm ${isAgentsActive ? 'font-medium text-primary' : 'text-text-secondary hover:text-primary'}`}
            >
              Agents
            </Link>
          )}
          <Link
            to="/me/analytics"
            className={`text-sm ${isMyUsageActive ? 'font-medium text-primary' : 'text-text-secondary hover:text-primary'}`}
          >
            My Usage
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-primary">{user?.name}</span>
          {isAdmin && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              Admin
            </span>
          )}
          <button onClick={logout} className="text-sm text-text-secondary hover:text-red-500">
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
      <div className="flex m-4">
        <span className="text-sm text-text-secondary">
        {currentOrg?.org.name}
      </span>
      </div></div>
  );
}

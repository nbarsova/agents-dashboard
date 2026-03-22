import type { AgentDetail, AgentWithStats, OrgOverview, PersonalAnalytics } from '@template/shared';

import { apiGet } from './client';

export function getAgents(orgId: string): Promise<AgentWithStats[]> {
  return apiGet<AgentWithStats[]>(`/orgs/${orgId}/agents`);
}

export function getOrgOverview(orgId: string, period = '30d'): Promise<OrgOverview> {
  return apiGet<OrgOverview>(`/orgs/${orgId}/analytics/overview?period=${period}`);
}

export function getAgentDetail(
  orgId: string,
  agentId: string,
  period = '30d',
  page = 1,
  perPage = 50,
  userId?: string,
): Promise<AgentDetail> {
  let url = `/orgs/${orgId}/analytics/agents/${agentId}?period=${period}&page=${page}&perPage=${perPage}`;
  if (userId) url += `&userId=${userId}`;
  return apiGet<AgentDetail>(url);
}

export function getPersonalAnalytics(
  orgId: string,
  period = '30d',
): Promise<PersonalAnalytics> {
  return apiGet<PersonalAnalytics>(`/me/analytics?period=${period}&orgId=${orgId}`);
}

import type { AgentDetail, OrgOverview, PersonalAnalytics } from '@template/shared';

import { apiGet } from './client';

export function getOrgOverview(orgId: string, period = '30d'): Promise<OrgOverview> {
  return apiGet<OrgOverview>(`/orgs/${orgId}/analytics/overview?period=${period}`);
}

export function getAgentDetail(
  orgId: string,
  agentId: string,
  period = '30d',
  page = 1,
  perPage = 50,
): Promise<AgentDetail> {
  return apiGet<AgentDetail>(
    `/orgs/${orgId}/analytics/agents/${agentId}?period=${period}&page=${page}&perPage=${perPage}`,
  );
}

export function getPersonalAnalytics(
  orgId: string,
  period = '30d',
): Promise<PersonalAnalytics> {
  return apiGet<PersonalAnalytics>(`/me/analytics?period=${period}&orgId=${orgId}`);
}

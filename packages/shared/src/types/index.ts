// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Entity types
export interface Organization {
  id: string;
  name: string;
  pricingPlan: 'token' | 'seat';
  tokenRate: string | null;
  sessionLimit: number | null;
  billingPeriodStart: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  userId: string;
  orgId: string;
  role: 'member' | 'admin';
}

export interface MembershipWithOrg extends Membership {
  org: Organization;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  repoUrl: string | null;
}

export interface Agent {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
}

export interface AgentProject {
  agentId: string;
  projectId: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  userId: string;
  orgId: string;
  projectId: string | null;
  sessionId: string | null;
  invocationChannel: string;
  tokensUsed: number;
  durationMs: number;
  status: 'success' | 'failure' | 'timeout';
  createdAt: string;
}

export interface AgentRunWithDetails extends AgentRun {
  agent: Pick<Agent, 'id' | 'name'>;
  user: Pick<User, 'id' | 'name'>;
  project: Pick<Project, 'id' | 'name'> | null;
  toolCallCount: number;
  toolCallBreakdown: { toolName: string; count: number }[];
}

export interface Tool {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
}

export interface ToolCall {
  id: string;
  agentRunId: string;
  toolId: string;
  tokensUsed: number;
  durationMs: number;
  status: 'success' | 'failure' | 'timeout';
  createdAt: string;
}

export interface Kpi {
  id: string;
  orgId: string;
  name: string;
  target: string | null;
  measurementMethod: string | null;
  currentValue: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KpiAgent {
  kpiId: string;
  agentId: string;
}

// Auth types
export interface SignupRequest {
  email: string;
  name: string;
  password: string;
  orgName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
  memberships: MembershipWithOrg[];
}

// Analytics types
export interface OrgOverview {
  totalRuns: number;
  totalTokens: number;
  totalCost: number | null;
  trends: TrendPoint[];
  topAgents: { agent: Pick<Agent, 'id' | 'name'>; runs: number; tokens: number }[];
  topUsers: { user: Pick<User, 'id' | 'name'>; runs: number; tokens: number }[];
  channelBreakdown: { channel: string; count: number }[];
}

export interface TrendPoint {
  date: string;
  runs: number;
  tokens: number;
}

export interface AgentDetail {
  agent: Agent;
  summary: {
    totalRuns: number;
    totalTokens: number;
    avgDurationMs: number;
    successRate: number;
  };
  runs: PaginatedResponse<AgentRunWithDetails>;
  kpis: Kpi[];
}

export interface PersonalAnalytics {
  totalRuns: number;
  totalTokens: number;
  cost: number | null;
  sessionUsage: { used: number; limit: number; percentage: number } | null;
  recentRuns: AgentRunWithDetails[];
  myAgents: { agent: Pick<Agent, 'id' | 'name'>; runs: number }[];
}

// KPI request types
export interface CreateKpiRequest {
  name: string;
  target?: string;
  measurementMethod?: string;
}

export interface UpdateKpiRequest {
  name?: string;
  target?: string;
  measurementMethod?: string;
  currentValue?: number;
}

// Seed request types
export interface SeedRequest {
  months?: number;
  eventsPerDay?: number;
  variance?: number;
}

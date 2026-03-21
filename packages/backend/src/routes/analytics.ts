import type {
  AgentDetail,
  AgentRunWithDetails,
  ApiResponse,
  OrgOverview,
  PersonalAnalytics,
  TrendPoint,
} from '@template/shared';
import { NextFunction, Response, Router } from 'express';

import { authenticate, AuthenticatedRequest, requireAdmin } from '../middleware/auth';
import { prisma } from '../index';
import { parsePeriod } from '../utils/period';

const router = Router();

// ── GET /api/orgs/:orgId/analytics/overview ──

router.get(
  '/orgs/:orgId/analytics/overview',
  authenticate,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response<ApiResponse<OrgOverview>>, next: NextFunction) => {
    try {
      const orgId = req.params.orgId as string;
      const since = parsePeriod(req.query.period as string | undefined);

      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      if (!org) {
        res.status(404).json({ data: null as unknown as OrgOverview, message: 'Org not found' });
        return;
      }

      const where = { orgId, createdAt: { gte: since } };

      // Total aggregations
      const agg = await prisma.agentRun.aggregate({
        where,
        _count: { id: true },
        _sum: { tokensUsed: true },
      });

      const totalRuns = agg._count.id;
      const totalTokens = agg._sum.tokensUsed ?? 0;
      const totalCost =
        org.pricingPlan === 'token' && org.tokenRate
          ? totalTokens * Number(org.tokenRate)
          : null;

      // Trends (group by day)
      const runs = await prisma.agentRun.findMany({
        where,
        select: { createdAt: true, tokensUsed: true },
        orderBy: { createdAt: 'asc' },
      });

      const trendMap = new Map<string, TrendPoint>();
      for (const run of runs) {
        const date = run.createdAt.toISOString().slice(0, 10);
        const existing = trendMap.get(date);
        if (existing) {
          existing.runs += 1;
          existing.tokens += run.tokensUsed;
        } else {
          trendMap.set(date, { date, runs: 1, tokens: run.tokensUsed });
        }
      }
      const trends = Array.from(trendMap.values());

      // Top agents
      const agentGroups = await prisma.agentRun.groupBy({
        by: ['agentId'],
        where,
        _count: { id: true },
        _sum: { tokensUsed: true },
        orderBy: { _count: { id: 'desc' } },
      });

      const agentIds = agentGroups.map((g) => g.agentId);
      const agents = await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true },
      });
      const agentMap = new Map(agents.map((a) => [a.id, a]));

      const topAgents = agentGroups.map((g) => ({
        agent: agentMap.get(g.agentId) ?? { id: g.agentId, name: 'Unknown' },
        runs: g._count.id,
        tokens: g._sum.tokensUsed ?? 0,
      }));

      // Top users
      const userGroups = await prisma.agentRun.groupBy({
        by: ['userId'],
        where,
        _count: { id: true },
        _sum: { tokensUsed: true },
        orderBy: { _count: { id: 'desc' } },
      });

      const userIds = userGroups.map((g) => g.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      const topUsers = userGroups.map((g) => ({
        user: userMap.get(g.userId) ?? { id: g.userId, name: 'Unknown' },
        runs: g._count.id,
        tokens: g._sum.tokensUsed ?? 0,
      }));

      // Channel breakdown
      const channelGroups = await prisma.agentRun.groupBy({
        by: ['invocationChannel'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      const channelBreakdown = channelGroups.map((g) => ({
        channel: g.invocationChannel,
        count: g._count.id,
      }));

      res.json({
        data: { totalRuns, totalTokens, totalCost, trends, topAgents, topUsers, channelBreakdown },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ── GET /api/orgs/:orgId/analytics/agents/:agentId ──

router.get(
  '/orgs/:orgId/analytics/agents/:agentId',
  authenticate,
  requireAdmin,
  async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse<AgentDetail>>,
    next: NextFunction,
  ) => {
    try {
      const orgId = req.params.orgId as string;
      const agentId = req.params.agentId as string;
      const since = parsePeriod(req.query.period as string | undefined);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage as string) || 50));

      const agent = await prisma.agent.findFirst({
        where: { id: agentId, orgId },
      });

      if (!agent) {
        res
          .status(404)
          .json({ data: null as unknown as AgentDetail, message: 'Agent not found' });
        return;
      }

      const where = { agentId, orgId, createdAt: { gte: since } };

      // Summary
      const agg = await prisma.agentRun.aggregate({
        where,
        _count: { id: true },
        _sum: { tokensUsed: true },
        _avg: { durationMs: true },
      });

      const successCount = await prisma.agentRun.count({
        where: { ...where, status: 'success' },
      });

      const totalRuns = agg._count.id;
      const successRate = totalRuns > 0 ? successCount / totalRuns : 0;

      // Paginated runs
      const [rawRuns, total] = await Promise.all([
        prisma.agentRun.findMany({
          where,
          include: {
            agent: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
            toolCalls: {
              include: { tool: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.agentRun.count({ where }),
      ]);

      const runsData: AgentRunWithDetails[] = rawRuns.map((r) => {
        const toolBreakdown = new Map<string, number>();
        for (const tc of r.toolCalls) {
          toolBreakdown.set(tc.tool.name, (toolBreakdown.get(tc.tool.name) ?? 0) + 1);
        }

        return {
          id: r.id,
          agentId: r.agentId,
          userId: r.userId,
          orgId: r.orgId,
          projectId: r.projectId,
          sessionId: r.sessionId,
          invocationChannel: r.invocationChannel,
          tokensUsed: r.tokensUsed,
          durationMs: r.durationMs,
          status: r.status as 'success' | 'failure' | 'timeout',
          createdAt: r.createdAt.toISOString(),
          agent: r.agent,
          user: r.user,
          project: r.project,
          toolCallCount: r.toolCalls.length,
          toolCallBreakdown: Array.from(toolBreakdown.entries()).map(([toolName, count]) => ({
            toolName,
            count,
          })),
        };
      });

      // Linked KPIs
      const kpiLinks = await prisma.kpiAgent.findMany({
        where: { agentId },
        include: { kpi: true },
      });

      const kpis = kpiLinks.map((l) => ({
        id: l.kpi.id,
        orgId: l.kpi.orgId,
        name: l.kpi.name,
        target: l.kpi.target,
        measurementMethod: l.kpi.measurementMethod,
        currentValue: l.kpi.currentValue?.toString() ?? null,
        createdAt: l.kpi.createdAt.toISOString(),
        updatedAt: l.kpi.updatedAt.toISOString(),
      }));

      res.json({
        data: {
          agent: {
            id: agent.id,
            orgId: agent.orgId,
            name: agent.name,
            description: agent.description,
          },
          summary: {
            totalRuns,
            totalTokens: agg._sum.tokensUsed ?? 0,
            avgDurationMs: Math.round(agg._avg.durationMs ?? 0),
            successRate,
          },
          runs: {
            data: runsData,
            total,
            page,
            limit: perPage,
          },
          kpis,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ── GET /api/me/analytics ──

router.get(
  '/me/analytics',
  authenticate,
  async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse<PersonalAnalytics>>,
    next: NextFunction,
  ) => {
    try {
      const userId = req.userId!;
      const since = parsePeriod(req.query.period as string | undefined);
      const orgId = req.query.orgId as string | undefined;

      // Get user's membership to determine pricing plan
      const memberships = await prisma.membership.findMany({
        where: { userId },
        include: { org: true },
      });

      if (memberships.length === 0) {
        res.status(404).json({
          data: null as unknown as PersonalAnalytics,
          message: 'No organization membership found',
        });
        return;
      }

      // Use specified orgId or first membership
      const membership = orgId
        ? memberships.find((m) => m.orgId === orgId)
        : memberships[0];

      if (!membership) {
        res.status(404).json({
          data: null as unknown as PersonalAnalytics,
          message: 'Organization membership not found',
        });
        return;
      }

      const org = membership.org;
      const where = { userId, orgId: org.id, createdAt: { gte: since } };

      // Aggregations
      const agg = await prisma.agentRun.aggregate({
        where,
        _count: { id: true },
        _sum: { tokensUsed: true },
      });

      const totalRuns = agg._count.id;
      const totalTokens = agg._sum.tokensUsed ?? 0;

      // Pricing
      const cost =
        org.pricingPlan === 'token' && org.tokenRate
          ? totalTokens * Number(org.tokenRate)
          : null;

      // Session usage for seat-based plans
      let sessionUsage: PersonalAnalytics['sessionUsage'] = null;
      if (org.pricingPlan === 'seat' && org.sessionLimit) {
        // Count distinct sessions since billing period start
        const sessionsResult = await prisma.agentRun.findMany({
          where: {
            userId,
            orgId: org.id,
            createdAt: { gte: org.billingPeriodStart },
            sessionId: { not: null },
          },
          select: { sessionId: true },
          distinct: ['sessionId'],
        });

        const used = sessionsResult.length;
        sessionUsage = {
          used,
          limit: org.sessionLimit,
          percentage: Math.round((used / org.sessionLimit) * 100 * 100) / 100,
        };
      }

      // Recent runs
      const rawRuns = await prisma.agentRun.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          toolCalls: {
            include: { tool: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const recentRuns: AgentRunWithDetails[] = rawRuns.map((r) => {
        const toolBreakdown = new Map<string, number>();
        for (const tc of r.toolCalls) {
          toolBreakdown.set(tc.tool.name, (toolBreakdown.get(tc.tool.name) ?? 0) + 1);
        }

        return {
          id: r.id,
          agentId: r.agentId,
          userId: r.userId,
          orgId: r.orgId,
          projectId: r.projectId,
          sessionId: r.sessionId,
          invocationChannel: r.invocationChannel,
          tokensUsed: r.tokensUsed,
          durationMs: r.durationMs,
          status: r.status as 'success' | 'failure' | 'timeout',
          createdAt: r.createdAt.toISOString(),
          agent: r.agent,
          user: r.user,
          project: r.project,
          toolCallCount: r.toolCalls.length,
          toolCallBreakdown: Array.from(toolBreakdown.entries()).map(([toolName, count]) => ({
            toolName,
            count,
          })),
        };
      });

      // My agents (agents the user has used)
      const agentGroups = await prisma.agentRun.groupBy({
        by: ['agentId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      const agentIds = agentGroups.map((g) => g.agentId);
      const agents = await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true },
      });
      const agentMap = new Map(agents.map((a) => [a.id, a]));

      const myAgents = agentGroups.map((g) => ({
        agent: agentMap.get(g.agentId) ?? { id: g.agentId, name: 'Unknown' },
        runs: g._count.id,
      }));

      res.json({
        data: { totalRuns, totalTokens, cost, sessionUsage, recentRuns, myAgents },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

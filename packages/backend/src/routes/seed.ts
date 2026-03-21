import type { ApiResponse, SeedRequest } from '@template/shared';
import bcrypt from 'bcrypt';
import { NextFunction, Request, Response, Router } from 'express';

import { prisma } from '../index';

const router = Router();

// ── Distribution helpers ──

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function logNormal(mean: number, sigma: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(Math.exp(Math.log(mean) + sigma * z));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date, businessHoursWeight: boolean): Date {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

  if (businessHoursWeight) {
    const roll = Math.random();
    if (roll < 0.7) {
      // Business hours: 9am-6pm
      date.setHours(randomInt(9, 17), randomInt(0, 59), randomInt(0, 59));
    } else if (roll < 0.9) {
      // Evening: 6pm-11pm
      date.setHours(randomInt(18, 22), randomInt(0, 59), randomInt(0, 59));
    } else {
      // Night/weekend: keep as-is
      date.setHours(randomInt(0, 8), randomInt(0, 59), randomInt(0, 59));
    }
  }

  return date;
}

// ── Seed data definitions ──

const HOGWARTS_USERS = [
  { name: 'Albus Dumbledore', email: 'dumbledore@hogwarts.edu', role: 'admin' as const },
  { name: 'Rubeus Hagrid', email: 'hagrid@hogwarts.edu', role: 'member' as const },
  { name: 'Neville Longbottom', email: 'neville@hogwarts.edu', role: 'member' as const },
  { name: 'Ron Weasley', email: 'ron@hogwarts.edu', role: 'member' as const },
  { name: 'Hermione Granger', email: 'hermione@hogwarts.edu', role: 'member' as const },
  { name: 'Harry Potter', email: 'harry@hogwarts.edu', role: 'member' as const },
  { name: 'Luna Lovegood', email: 'luna@hogwarts.edu', role: 'member' as const },
  { name: 'Ginny Weasley', email: 'ginny@hogwarts.edu', role: 'member' as const },
  { name: 'Minerva McGonagall', email: 'mcgonagall@hogwarts.edu', role: 'admin' as const },
  { name: 'Severus Snape', email: 'snape@hogwarts.edu', role: 'member' as const },
];

// Zipf-like weights: Hagrid most active, then Neville, Ron, others decreasing
const HOGWARTS_USER_WEIGHTS = [2, 30, 18, 14, 10, 8, 6, 5, 4, 3];

const MINISTRY_USERS = [
  { name: 'Cornelius Fudge', email: 'fudge@ministry.gov', role: 'admin' as const },
  { name: 'Arthur Weasley', email: 'arthur@ministry.gov', role: 'member' as const },
  { name: 'Nymphadora Tonks', email: 'tonks@ministry.gov', role: 'member' as const },
  { name: 'Kingsley Shacklebolt', email: 'kingsley@ministry.gov', role: 'member' as const },
  { name: 'Percy Weasley', email: 'percy@ministry.gov', role: 'member' as const },
  { name: 'Dolores Umbridge', email: 'umbridge@ministry.gov', role: 'member' as const },
  { name: 'Rufus Scrimgeour', email: 'scrimgeour@ministry.gov', role: 'member' as const },
  { name: 'Amelia Bones', email: 'bones@ministry.gov', role: 'member' as const },
];

const MINISTRY_USER_WEIGHTS = [3, 25, 20, 15, 12, 10, 8, 7];

const HOGWARTS_AGENTS = [
  { name: "Marauder's Map Scanner", description: 'Monitors castle corridors and grounds' },
  { name: 'Owl Post Dispatcher', description: 'Routes and tracks owl mail deliveries' },
  { name: 'Potion Recipe Analyzer', description: 'Validates potion ingredients and procedures' },
  { name: 'Sorting Hat Advisor', description: 'Provides house placement recommendations' },
  {
    name: 'Forbidden Forest Monitor',
    description: 'Tracks creature movements in the forest',
  },
];

const MINISTRY_AGENTS = [
  { name: 'Decree Compliance Checker', description: 'Validates ministry decree adherence' },
  {
    name: 'Muggle Incident Reporter',
    description: 'Processes muggle-wizard interaction reports',
  },
  { name: 'Floo Network Router', description: 'Manages floo network traffic and routing' },
  { name: 'Azkaban Security Monitor', description: 'Monitors Azkaban security systems' },
];

// Pareto weights: first 2 agents get 80% usage
const AGENT_WEIGHTS_5 = [35, 30, 15, 12, 8];
const AGENT_WEIGHTS_4 = [40, 30, 18, 12];

const HOGWARTS_PROJECTS = [
  { name: 'Forbidden Forest Monitoring', repoUrl: 'https://github.com/hogwarts/forest-monitor' },
  { name: 'Quidditch Stats Tracker', repoUrl: 'https://github.com/hogwarts/quidditch-stats' },
  { name: 'Library Catalog System', repoUrl: 'https://github.com/hogwarts/library-catalog' },
  { name: 'Defense Against Dark Arts Curriculum', repoUrl: null },
];

const MINISTRY_PROJECTS = [
  { name: 'Muggle Protection Act', repoUrl: 'https://github.com/ministry/muggle-protection' },
  { name: 'International Cooperation Portal', repoUrl: 'https://github.com/ministry/intl-coop' },
  { name: 'Wizengamot Case Management', repoUrl: null },
];

const TOOL_DEFINITIONS = [
  { name: 'spell_checker', description: 'Validates spell syntax and incantations' },
  { name: 'patronus_api', description: 'Invokes patronus charm interface' },
  { name: 'floo_network', description: 'Accesses floo network for communication' },
  { name: 'pensieve_search', description: 'Searches memory archives' },
  { name: 'owl_tracker', description: 'Tracks owl delivery status' },
  { name: 'wand_registry', description: 'Looks up wand ownership records' },
  { name: 'marauders_map', description: 'Real-time location lookup' },
];

const TOOL_WEIGHTS = [25, 15, 18, 12, 10, 8, 12];

const CHANNELS = ['cli', 'web', 'integration:slack', 'integration:linear', 'api'];
const CHANNEL_WEIGHTS = [45, 30, 15, 5, 5];

const STATUSES: ('success' | 'failure' | 'timeout')[] = ['success', 'failure', 'timeout'];
const STATUS_WEIGHTS = [92, 5, 3];

const HOGWARTS_KPIS = [
  { name: 'Student Safety Index', target: '95%', measurementMethod: 'Incident reports per term' },
  {
    name: 'Owl Delivery Success Rate',
    target: '99%',
    measurementMethod: 'Delivered / Total sent',
  },
  {
    name: 'Potion Brewing Accuracy',
    target: '90%',
    measurementMethod: 'Correct potions / Total attempts',
  },
];

const MINISTRY_KPIS = [
  {
    name: 'Muggle Incident Response Time',
    target: '<30 min',
    measurementMethod: 'Avg minutes from report to resolution',
  },
  {
    name: 'Decree Compliance Rate',
    target: '98%',
    measurementMethod: 'Compliant entities / Total checked',
  },
];

// ── Seed logic ──

async function seedOrg(
  orgData: {
    name: string;
    pricingPlan: 'token' | 'seat';
    tokenRate?: number;
    sessionLimit?: number;
  },
  users: { name: string; email: string; role: 'member' | 'admin' }[],
  userWeights: number[],
  agents: { name: string; description: string }[],
  agentWeights: number[],
  projects: { name: string; repoUrl: string | null }[],
  kpis: { name: string; target: string; measurementMethod: string }[],
  months: number,
  eventsPerDay: number,
  variance: number,
) {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create org
  const org = await prisma.organization.create({
    data: {
      name: orgData.name,
      pricingPlan: orgData.pricingPlan,
      tokenRate: orgData.tokenRate,
      sessionLimit: orgData.sessionLimit,
      billingPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
  });

  // Create users + memberships
  const createdUsers = await Promise.all(
    users.map(async (u) => {
      const user = await prisma.user.create({
        data: { email: u.email, name: u.name, passwordHash },
      });
      await prisma.membership.create({
        data: { userId: user.id, orgId: org.id, role: u.role },
      });
      return user;
    }),
  );

  // Create projects
  const createdProjects = await Promise.all(
    projects.map((p) =>
      prisma.project.create({
        data: { orgId: org.id, name: p.name, repoUrl: p.repoUrl },
      }),
    ),
  );

  // Create agents
  const createdAgents = await Promise.all(
    agents.map((a) =>
      prisma.agent.create({
        data: { orgId: org.id, name: a.name, description: a.description },
      }),
    ),
  );

  // Create agent-project links (each agent linked to 1-3 random projects)
  for (const agent of createdAgents) {
    const numProjects = randomInt(1, Math.min(3, createdProjects.length));
    const shuffled = [...createdProjects].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numProjects; i++) {
      await prisma.agentProject.create({
        data: { agentId: agent.id, projectId: shuffled[i].id },
      });
    }
  }

  // Create tools
  const createdTools = await Promise.all(
    TOOL_DEFINITIONS.map((t) =>
      prisma.tool.create({
        data: { orgId: org.id, name: t.name, description: t.description },
      }),
    ),
  );

  // Create KPIs and link to agents
  for (const kpi of kpis) {
    const created = await prisma.kpi.create({
      data: {
        orgId: org.id,
        name: kpi.name,
        target: kpi.target,
        measurementMethod: kpi.measurementMethod,
        currentValue: Math.round(Math.random() * 100 * 100) / 100,
      },
    });
    // Link to 1-2 random agents
    const numLinks = randomInt(1, 2);
    const shuffledAgents = [...createdAgents].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numLinks; i++) {
      await prisma.kpiAgent.create({
        data: { kpiId: created.id, agentId: shuffledAgents[i].id },
      });
    }
  }

  // Generate agent runs
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - months);

  const totalDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Build all runs in memory first, then batch insert
  const allRuns: {
    agentId: string;
    userId: string;
    orgId: string;
    projectId: string | null;
    sessionId: string | null;
    invocationChannel: string;
    tokensUsed: number;
    durationMs: number;
    status: string;
    createdAt: Date;
  }[] = [];

  for (let day = 0; day < totalDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);

    // Gradual adoption increase
    const adoptionMultiplier = 0.5 + 0.5 * (day / totalDays);
    const dailyVariance = 1 + (Math.random() * 2 - 1) * variance;
    const dayEvents = Math.round(eventsPerDay * adoptionMultiplier * dailyVariance);

    // Weekend reduction
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
    const actualEvents = isWeekend ? Math.round(dayEvents * 0.2) : dayEvents;

    // Group into sessions
    let remaining = actualEvents;
    while (remaining > 0) {
      const sessionSize = Math.min(randomInt(2, 8), remaining);
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const sessionUser = weightedRandom(createdUsers, userWeights);
      const sessionAgent = weightedRandom(createdAgents, agentWeights);
      const sessionChannel = weightedRandom(CHANNELS, CHANNEL_WEIGHTS);

      // Pick a project from the agent's linked projects, or null
      const agentProjectLinks = await prisma.agentProject.findMany({
        where: { agentId: sessionAgent.id },
      });
      const projectId =
        agentProjectLinks.length > 0
          ? agentProjectLinks[randomInt(0, agentProjectLinks.length - 1)].projectId
          : null;

      const sessionStart = randomDate(
        dayDate,
        new Date(dayDate.getTime() + 24 * 60 * 60 * 1000),
        true,
      );

      for (let i = 0; i < sessionSize; i++) {
        const runTime = new Date(sessionStart.getTime() + i * randomInt(30000, 300000));
        if (runTime > now) break;

        allRuns.push({
          agentId: sessionAgent.id,
          userId: sessionUser.id,
          orgId: org.id,
          projectId,
          sessionId,
          invocationChannel: sessionChannel,
          tokensUsed: Math.max(100, Math.min(50000, logNormal(2000, 0.8))),
          durationMs: Math.max(500, Math.min(300000, logNormal(5000, 0.7))),
          status: weightedRandom(STATUSES, STATUS_WEIGHTS),
          createdAt: runTime,
        });
      }

      remaining -= sessionSize;
    }
  }

  // Batch insert runs in chunks of 500
  for (let i = 0; i < allRuns.length; i += 500) {
    const chunk = allRuns.slice(i, i + 500);
    await prisma.agentRun.createMany({ data: chunk });
  }

  // Generate tool calls for each run (batch by loading run IDs)
  const runIds = await prisma.agentRun.findMany({
    where: { orgId: org.id },
    select: { id: true },
  });

  const allToolCalls: {
    agentRunId: string;
    toolId: string;
    tokensUsed: number;
    durationMs: number;
    status: string;
    createdAt: Date;
  }[] = [];

  for (const run of runIds) {
    const numCalls = randomInt(1, 10);
    for (let i = 0; i < numCalls; i++) {
      const tool = weightedRandom(createdTools, TOOL_WEIGHTS);
      allToolCalls.push({
        agentRunId: run.id,
        toolId: tool.id,
        tokensUsed: Math.max(10, Math.min(5000, logNormal(300, 0.6))),
        durationMs: Math.max(50, Math.min(30000, logNormal(800, 0.7))),
        status: weightedRandom(STATUSES, STATUS_WEIGHTS),
        createdAt: new Date(),
      });
    }
  }

  // Batch insert tool calls in chunks of 1000
  for (let i = 0; i < allToolCalls.length; i += 1000) {
    const chunk = allToolCalls.slice(i, i + 1000);
    await prisma.toolCall.createMany({ data: chunk });
  }

  return {
    org: org.name,
    users: createdUsers.length,
    agents: createdAgents.length,
    projects: createdProjects.length,
    tools: createdTools.length,
    runs: allRuns.length,
    toolCalls: allToolCalls.length,
    kpis: kpis.length,
  };
}

// POST /api/admin/seed
router.post(
  '/',
  async (
    req: Request<object, object, SeedRequest>,
    res: Response<ApiResponse<object>>,
    next: NextFunction,
  ) => {
    try {
      const { months = 3, eventsPerDay = 150, variance = 0.3 } = req.body || {};

      console.log(`Seeding data: ${months} months, ${eventsPerDay} events/day...`);

      const hogwarts = await seedOrg(
        { name: 'Hogwarts School of Witchcraft and Wizardry', pricingPlan: 'token', tokenRate: 0.00003 },
        HOGWARTS_USERS,
        HOGWARTS_USER_WEIGHTS,
        HOGWARTS_AGENTS,
        AGENT_WEIGHTS_5,
        HOGWARTS_PROJECTS,
        HOGWARTS_KPIS,
        months,
        eventsPerDay,
        variance,
      );

      const ministry = await seedOrg(
        { name: 'Ministry of Magic', pricingPlan: 'seat', sessionLimit: 500 },
        MINISTRY_USERS,
        MINISTRY_USER_WEIGHTS,
        MINISTRY_AGENTS,
        AGENT_WEIGHTS_4,
        MINISTRY_PROJECTS,
        MINISTRY_KPIS,
        months,
        Math.round(eventsPerDay * 0.7),
        variance,
      );

      console.log('Seeding complete.');

      res.json({
        data: { hogwarts, ministry },
        message: 'Seed data generated successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/admin/seed/reset
router.post(
  '/reset',
  async (
    _req: Request,
    res: Response<ApiResponse<{ message: string }>>,
    next: NextFunction,
  ) => {
    try {
      // Delete in dependency order
      await prisma.toolCall.deleteMany();
      await prisma.agentRun.deleteMany();
      await prisma.kpiAgent.deleteMany();
      await prisma.kpi.deleteMany();
      await prisma.agentProject.deleteMany();
      await prisma.tool.deleteMany();
      await prisma.agent.deleteMany();
      await prisma.project.deleteMany();
      await prisma.membership.deleteMany();
      await prisma.user.deleteMany();
      await prisma.organization.deleteMany();

      res.json({ data: { message: 'All data cleared' } });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

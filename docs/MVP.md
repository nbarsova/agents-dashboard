# MVP Implementation

## Scope

Implementation of the analytics dashboard with mock agent data. No real agent runtime — all event data is generated via a seed endpoint.

### What Was Built

| Layer                | What Was Built                                                                                                                |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **Database**         | Prisma schema: `User`, `Organization`, `Membership`, `Project`, `Agent`, `AgentProject`, `AgentRun`, `Tool`, `ToolCall`, `Kpi`, `KpiAgent` |
| **Auth**             | Signup, login (email + password), JWT sessions, RBAC middleware (member/admin)                                                |
| **Analytics API**    | REST endpoints for org overview, agent detail (with expandable runs), personal dashboard                                     |
| **Pricing logic**    | Token-based cost calculation and seat-based session limit tracking, driven by `org.pricingPlan`                              |
| **Dashboard UI**     | Login, signup, org overview, agent detail, personal dashboard — 5 screens total                                              |
| **Mock data system** | Seed endpoint generating realistic historical data for 2 organizations                                                      |

### Authentication: Built In-House (PostgreSQL)

Self-contained auth with `users`, `organizations`, `memberships` tables. Handles signup, login (email + password), org creation, invites, and role assignment directly.

**Why for MVP:** No vendor dependency, single DB for joins across org/user/analytics, full control over the data model. Keeps the system self-contained and demonstrable.

**Accepted tradeoffs:** We own auth security (password hashing, token rotation, brute-force protection). MFA and enterprise SSO are deferred.

## Screens and User Stories

### 1. Login (`/login`)

- **As a user**, I can log in with my email and password so that I can access the dashboard.
- **As a user**, I see validation errors if I submit invalid credentials.
- **As a user**, I am redirected to my personal dashboard after successful login.
- **As a user**, I can navigate to the signup page if I don't have an account.

### 2. Signup (`/signup`)

- **As a new user**, I can create an account by providing my name, email, password, and organization name.
- **As a new user**, my organization is created automatically with token-based pricing.
- **As a new user**, I am assigned the admin role in the newly created organization.
- **As a new user**, I am redirected to my personal dashboard after signup.

### 3. Personal Dashboard (`/me/analytics`)

- **As a user**, I can see my personal usage metrics: total runs, total tokens, and estimated cost (token plan) or session usage (seat plan).
- **As a user on a seat plan**, I see a session usage gauge showing used/limit with color-coded thresholds (green, yellow at 80%, red at 100%).
- **As a user**, I can see a list of my recent agent runs with agent name, project, timestamp, tokens, status, and duration.
- **As a user**, I can see the agents I have access to along with my run counts per agent.
- **As a user**, I can click on an agent to navigate to its detail page.
- **As a user**, I can filter all metrics by time period (7d, 30d, 90d).

### 4. Organization Overview (`/orgs/:orgId/overview`) — Admin Only

- **As an admin**, I can see organization-wide metrics: total runs, total tokens, and estimated cost (or "N/A (seat plan)" for seat-based orgs).
- **As an admin**, I can see a trends chart showing runs and token usage over time (dual-axis line chart).
- **As an admin**, I can see a channel breakdown pie chart (CLI, Web, Slack, Linear, API).
- **As an admin**, I can see ranked lists of top agents and top users by runs and tokens.
- **As an admin**, I can expand the top lists to see all entries beyond the default top 5.
- **As an admin**, I can click on a top agent to navigate to its detail page.
- **As an admin**, I can filter all metrics by time period (7d, 30d, 90d).

### 5. Agent Detail (`/orgs/:orgId/agents/:agentId`) — Admin Only

- **As an admin**, I can see an agent's summary metrics: total runs, total tokens, average duration, and success rate.
- **As an admin**, I can see KPIs linked to the agent with their target and current values.
- **As an admin**, I can see a paginated table of all runs for the agent with columns: timestamp, user, project, channel, tokens, duration, status, and tool count.
- **As an admin**, I can click on a run row to expand it and see the tool call breakdown with individual tool names and call counts.
- **As an admin**, I can paginate through runs using Previous/Next controls.
- **As an admin**, I can filter all metrics by time period (7d, 30d, 90d).

### 6. App Layout (shared across all authenticated screens)

- **As a user**, I see a navigation bar with links to "My Usage" and (if admin) "Organization Overview".
- **As a user with multiple org memberships**, I can switch between organizations using a dropdown.
- **As a user**, I can see my name, current org name, and role badge (if admin).
- **As a user**, I can log out from the navigation bar.

## Architecture

```
┌──────────────────────────────────────────────────┐
│         Client (React + Vite + Tailwind)         │
│  ┌──────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │Org Overview  │ │Agent Detail│ │Personal View│ │
│  └──────┬───────┘ └─────┬──────┘ └──────┬──────┘ │
│         └───────────────┼───────────────┘        │
└─────────────────────────┼────────────────────────┘
                          │ REST + JWT
┌─────────────────────────┼────────────────────────┐
│            Express API Server (Node.js)          │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │Auth      │ │Analytics │ │Seed              │  │
│  │Routes    │ │Routes    │ │Routes (dev only) │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌─────────────────────────────────────────────┐ │
│  │     Role Based Access Control Middleware    │ │
│  │        (JWT + role)                         │ │
│  └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │         Prisma Client (PostgreSQL)          │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────┼────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │    PostgreSQL 16      │
              │    (Docker Compose)   │
              └───────────────────────┘
```

## Database Schema (Prisma)

```prisma
model Organization {
  id                 String       @id @default(cuid())
  name               String
  pricingPlan        String       // 'token' | 'seat'
  tokenRate          Decimal?     @db.Decimal(10, 6)
  sessionLimit       Int?
  billingPeriodStart DateTime     @default(now())
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  memberships Membership[]
  projects    Project[]
  agents      Agent[]
  agentRuns   AgentRun[]
  tools       Tool[]
  kpis        Kpi[]
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  memberships Membership[]
  agentRuns   AgentRun[]
}

model Membership {
  userId String
  orgId  String
  role   String // 'member' | 'admin'

  user User         @relation(fields: [userId], references: [id])
  org  Organization @relation(fields: [orgId], references: [id])

  @@id([userId, orgId])
}

model Project {
  id      String  @id @default(cuid())
  orgId   String
  name    String
  repoUrl String?

  org       Organization   @relation(fields: [orgId], references: [id])
  agents    AgentProject[]
  agentRuns AgentRun[]
}

model Agent {
  id          String  @id @default(cuid())
  orgId       String
  name        String
  description String?

  org       Organization   @relation(fields: [orgId], references: [id])
  projects  AgentProject[]
  agentRuns AgentRun[]
  kpiAgents KpiAgent[]
}

model AgentProject {
  agentId   String
  projectId String

  agent   Agent   @relation(fields: [agentId], references: [id])
  project Project @relation(fields: [projectId], references: [id])

  @@id([agentId, projectId])
}

model AgentRun {
  id                String   @id @default(cuid())
  agentId           String
  userId            String
  orgId             String
  projectId         String?
  sessionId         String?
  invocationChannel String
  tokensUsed        Int
  durationMs        Int
  status            String   // 'success' | 'failure' | 'timeout'
  createdAt         DateTime @default(now())

  agent     Agent        @relation(fields: [agentId], references: [id])
  user      User         @relation(fields: [userId], references: [id])
  org       Organization @relation(fields: [orgId], references: [id])
  project   Project?     @relation(fields: [projectId], references: [id])
  toolCalls ToolCall[]

  @@index([orgId, createdAt(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
  @@index([agentId, createdAt(sort: Desc)])
  @@index([orgId, agentId, createdAt(sort: Desc)])
}

model Tool {
  id          String  @id @default(cuid())
  orgId       String
  name        String
  description String?

  org       Organization @relation(fields: [orgId], references: [id])
  toolCalls ToolCall[]

  @@unique([orgId, name])
}

model ToolCall {
  id         String   @id @default(cuid())
  agentRunId String
  toolId     String
  tokensUsed Int
  durationMs Int
  status     String   // 'success' | 'failure' | 'timeout'
  createdAt  DateTime @default(now())

  agentRun AgentRun @relation(fields: [agentRunId], references: [id], onDelete: Cascade)
  tool     Tool     @relation(fields: [toolId], references: [id])

  @@index([agentRunId])
  @@index([toolId])
}

model Kpi {
  id                String   @id @default(cuid())
  orgId             String
  name              String
  target            String?
  measurementMethod String?
  currentValue      Decimal? @db.Decimal(12, 2)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  org        Organization   @relation(fields: [orgId], references: [id])
  kpiAgents KpiAgent[]
}

model KpiAgent {
  kpiId   String
  agentId String

  kpi   Kpi   @relation(fields: [kpiId], references: [id], onDelete: Cascade)
  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@id([kpiId, agentId])
}
```

## Mock Data System

### Seed Endpoint

`POST /api/admin/seed` generates realistic historical data. `POST /api/admin/seed/reset` clears all data.

```json
{
  "months": 3,
  "eventsPerDay": 150,
  "variance": 0.3
}
```

**Distribution rules:**
- **Channel**: CLI 45%, Web 30%, Slack 15%, Linear 5%, API 5%
- **Users**: Zipf-like — a few power users generate most runs
- **Agents**: Pareto — top 1-2 agents receive 70%+ of invocations
- **Tokens**: Log-normal, mean ~2000, range 100-50,000
- **Status**: 92% success, 5% failure, 3% timeout
- **Sessions**: 2-8 runs per session
- **Trends**: Gradual adoption growth from 50% to 100% over the period
- **Weekday/weekend**: Weekends have 80% fewer events

### Seeded Organizations

| Property          | Hogwarts School                          | Ministry of Magic                       |
|-------------------|------------------------------------------|-----------------------------------------|
| **Pricing plan**  | Token-based ($0.00003/token)             | Seat-based (500 session limit)          |
| **Admins**        | 2 (Dumbledore, McGonagall)               | 1 (Fudge)                               |
| **Members**       | 8                                        | 7                                        |
| **Agents**        | 5                                        | 4                                        |
| **Projects**      | 4                                        | 3                                        |
| **KPIs**          | 3                                        | 2                                        |

All seeded users have password: `password123`

## Tech Stack

| Layer        | Choice                          |
|--------------|---------------------------------|
| Frontend     | React 19 + TypeScript           |
| Charts       | Recharts                        |
| Styling      | Tailwind CSS 4                  |
| API          | Express 5 + TypeScript          |
| ORM          | Prisma 7                        |
| Shared types | `@template/shared`              |
| Auth         | bcrypt + jsonwebtoken           |
| Database     | PostgreSQL 16                   |
| Dev tooling  | Vite 7 (frontend), tsx (backend)|

## API Endpoints

### Auth
```
POST /api/auth/signup           { email, name, password, orgName? }
POST /api/auth/login            { email, password }
GET  /api/auth/me               -> current user + org memberships
```

### Analytics (requires auth)
```
GET /api/orgs/:orgId/analytics/overview?period=30d        (admin only)
GET /api/orgs/:orgId/analytics/agents/:agentId?period=30d&page=1&perPage=50  (admin only)
GET /api/me/analytics?period=30d                          (any user)
```

### Seed (dev only)
```
POST /api/admin/seed            { months, eventsPerDay, variance }
POST /api/admin/seed/reset
```

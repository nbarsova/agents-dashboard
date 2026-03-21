# PRD: Organizational Agents Analytics Dashboard

## Proposed Solution

### How It Works

A customer-facing analytics dashboard embedded in the platform's web UI, providing real-time and historical views of agent usage across the organization.

#### Core Data Model

The system captures **agent run events** as the atomic unit, each containing:

| Field               | Source                     | Description                                                   |
|---------------------|----------------------------|---------------------------------------------------------------|
| `id`                | Agent runtime              | Unique identifier for the run                                 |
| `agentId`           | Agent registry             | Which agent was executed                                      |
| `userId`            | Auth/session               | Who triggered it                                              |
| `orgId`             | Auth/session               | Which organization                                            |
| `createdAt`         | Agent runtime              | When the run started                                          |
| `tokensUsed`        | Agent runtime              | Input + output token count                                    |
| `projectId`         | Agent config / Git context | Repository or project association                             |
| `invocationChannel` | Entry point detection      | CLI / Web UI / Custom API / Integration (Slack, Linear, etc.) |
| `sessionId`         | Agent runtime              | Groups related runs in a session                              |
| `status`            | Agent runtime              | Success / failure / timeout                                   |
| `durationMs`        | Agent runtime              | Wall-clock execution time                                     |

Each agent run contains zero or more **tool calls**. Tools are configured per-organization and represent external capabilities an agent can invoke (e.g., file read, web search, code execution, API calls).

**Tool** (configured per org):

| Field         | Description                                      |
|---------------|--------------------------------------------------|
| `id`          | Unique identifier                                |
| `orgId`       | Which organization this tool belongs to          |
| `name`        | Tool name (e.g., "web_search")      |
| `description` | What the tool does                               |

**ToolCall** (recorded per agent run):

| Field         | Source        | Description                                          |
|---------------|---------------|------------------------------------------------------|
| `id`          | Agent runtime | Unique identifier for the call                       |
| `agentRunId`  | Agent runtime | Which run this call belongs to                       |
| `toolId`      | Agent runtime | Which tool was invoked                               |
| `tokensUsed`  | Agent runtime | Tokens consumed by this tool call                    |
| `durationMs`  | Agent runtime | Wall-clock execution time of the call                |
| `status`      | Agent runtime | Success / failure / timeout                          |
| `createdAt`   | Agent runtime | When the call was made                               |

This enables analytics like: most-used tools per agent, tool failure rates, token cost breakdown by tool, and tool-level performance trends.

#### Pricing Calculation Engine

There exist two possible pricing models for an organization:

**Token-based pricing:**
- `cost = tokensUsed × org.tokenRate`
- Token rate is configurable per org (set during contract/plan setup)
- Displayed as approximate cost alongside every run and in aggregate views

**Seat-based pricing:**
- Each user seat has a token limit per one session
- `usagePct = tokensUsed / sessionLimit × 100`
- Displayed as a progress bar / gauge per user
- Alerts at 80% and 100% thresholds

The pricing model is determined by `Organization.pricingPlan` — the dashboard adapts its display accordingly.

#### Dashboard Views

**1. Organization Overview (Admin)**
- Total runs, total tokens, total cost (time-period selectable)
- Usage trend chart (daily/weekly/monthly)
- Top agents by usage
- Top users by usage
- Channel breakdown (CLI / Web / Integration pie chart)
- KPI impact summary (if KPIs configured)

**2. Agent Detail View (Admin)**
- Expandable usage rows showing:
  - Run timestamp
  - User who ran it
  - Tokens used (+ approximate cost for token-based plans)
  - Session limit usage (for seat-based plans)
  - Project/repository
  - Invocation channel
  - Execution time
  - Tool calls summary (count, breakdown by tool)
- Linked KPIs with trend overlay
- Filterable by user, project, channel, date range

**3. Personal Dashboard (Member)**
- Own usage only (same metrics as agent detail, filtered to `userId = self`)
- Personal cost / session limit tracking
- "My agents" quick view

**4. Organization Settings (Admin)**

Unified settings screen with two tabs: Projects and KPIs.

**Projects tab:**
- Create/edit/delete projects (name, repository URL)

**KPIs tab:**
- Create/edit KPIs manually (name, target, measurement method)
- Import from external tools (Monday.com, Linear, Jira) via OAuth
- Link KPIs to specific agents (many-to-many via `KpiAgent`)
- KPI trend displayed alongside agent usage for correlation

#### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Org Overview │  │ Agent Detail │  │ Personal Dashboard│  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
│         └─────────────────┼───────────────────┘             │
│                           │ REST                            │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    API Gateway                              │
│              (Auth / Rate Limiting / RBAC)                  │
│         member: own data only | admin: org-wide             │
└───────────────────────────┼─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────────┐
│  Analytics API  │ │  KPI Service│ │  Pricing Service    │
│  (query, agg,   │ │  (CRUD,     │ │  (token rates,      │
│  filter, export)│ │   import)   │ │   session limits,   │
│                 │ │             │ │  cost calculation)  │
└────────┬────────┘ └──────┬──────┘ └──────────┬──────────┘
         │                 │                    │
         ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Store Layer                         │
│                                                             │
│  ┌──────────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │  TimescaleDB /   │  │  PostgreSQL │  │  Redis        │   │
│  │  ClickHouse      │  │  (KPIs,     │  │  (caching,    │   │
│  │  (run events,    │  │   orgs,     │  │   rate limits,│   │
│  │   time-series    │  │   users,    │  │   sessions)   │   │
│  │   aggregations)  │  │   plans)    │  │               │   │
│  └──────────────────┘  └─────────────┘  └───────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Event ingestion
┌───────────────────────────┼─────────────────────────────────┐
│                   Event Pipeline                            │
│  ┌───────────────┐  ┌─────┴───────┐  ┌───────────────────┐  │
│  │ Agent Runtime │→ │  Kafka /    │→ │  Stream Processor │  │
│  │ (emits events)│  │  SQS Queue  │  │  (enrichment,     │  │
│  └───────────────┘  └─────────────┘  │   dedup, pricing) │  │
│                                      └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**
- **Event sourcing**: Agent runs emit immutable events → queued → processed → stored. This decouples the agent runtime from analytics and allows replay/reprocessing.
- **OLAP store for time-series**: ClickHouse or TimescaleDB for fast aggregations over millions of run events (GROUP BY time bucket, agent, user, channel).
- **Pre-aggregated rollups**: Materialized views for hourly/daily/monthly aggregations to keep dashboard queries fast (<200ms p95).
- **RBAC at API layer**: Members see `WHERE userId = :self`, admins see `WHERE orgId = :org`. Single query path, different filters.

#### Invocation Channel Detection

Since we control the agent runtime, each entry point tags the run:

| Channel            | How Detected                                            |
|--------------------|---------------------------------------------------------|
| CLI                | Agent SDK sets `channel = "cli"` from CLI entrypoint    |
| Web UI (generic)   | Frontend sets `channel = "web"` in API call             |
| Custom Web UI      | Frontend sets `channel = "web:custom:{app_name}"`       |
| Slack integration  | Bot handler sets `channel = "integration:slack"`        |
| Linear integration | Webhook handler sets `channel = "integration:linear"`   |
| API direct         | API gateway sets `channel = "api"` if no channel header |

#### KPI Integration

```
┌─────────────────┐     ┌─────────────────┐
│  Monday.com     │────▶│                 │
│  Linear         │────▶│   KPI Service   │──── KPI values + trends
│  Jira           │────▶│   (OAuth sync)  │
│  Manual entry   │────▶│                 │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   KpiAgent      │
                        │  (many-to-many) │
                        │                 │
                        └─────────────────┘
```

Admins link KPIs to agents. The dashboard overlays KPI trends on agent usage charts, enabling visual correlation (not causal attribution — we're explicit about this).

### User Stories

**Story 1: Admin reviews monthly agent spend**
- **As an** org admin
- **I want to** see total token usage and approximate cost across all agents for the current billing period, broken down by team and agent
- **So that** I can report to finance and justify our agent platform spend

**Story 2: Engineer checks personal usage against session limit**
- **As a** team member on a seat-based plan
- **I want to** see how many sessions I've used this period and how close I am to my limit
- **So that** I can pace my usage or request a limit increase before hitting the cap

**Story 3: Admin investigates adoption by channel**
- **As an** org admin
- **I want to** see which invocation channels (CLI, Slack, Web UI) drive the most agent usage
- **So that** I can focus developer enablement efforts on underutilized channels and understand adoption patterns

**Story 4: Admin correlates agent usage with KPIs**
- **As an** org admin who has linked a "deployment frequency" KPI to the CI/CD agent
- **I want to** see the KPI trend overlaid on agent usage over the past quarter
- **So that** I can assess whether increased agent usage correlates with improved deployment frequency

## Non-Goals

- **Causal KPI attribution** — we show correlation, not "this agent caused this KPI change"
- **Agent configuration/management** — this is analytics only, not a control plane
- **Per-run detailed logs/traces** — we show metadata, not full conversation logs (that's a separate observability concern)
- **Billing/invoicing** — we show approximate costs for visibility; actual billing is handled by the billing system
- **Custom report builder** — v1 ships fixed views; custom queries/exports are a future enhancement

## User & Organization Management

### Data Model

```
┌──────────────┐     ┌───────────────────┐     ┌────────────────────┐
│    User      │────▶│   Membership      │◀────│  Organization      │
│              │     │                   │     │                    │
│  id          │     │  userId           │     │  id                │
│  email       │     │  orgId            │     │  name              │
│  name        │     │  role: member|    │     │  pricingPlan       │
│  passwordHash│     │         admin     │     │  tokenRate         │
│  createdAt   │     │                   │     │  sessionLimit      │
│  updatedAt   │     │                   │     │  billingPeriodStart│
└──────────────┘     └───────────────────┘     │  createdAt         │
                                               │  updatedAt         │
                                               └────────────────────┘
```

- A user can belong to multiple orgs (role is per-membership, not per-user)
- Pricing config lives on the org entity
- RBAC enforced at API middleware: members see `WHERE userId = :self`, admins see `WHERE orgId = :org`

### MVP: Built In-House (PostgreSQL)

Self-contained auth with `users`, `organizations`, `memberships` tables. Handles signup, login (email + password), org creation, invites, and role assignment directly.

**Why for MVP:** No vendor dependency, single DB for joins across org/user/analytics, full control over the data model. Keeps the system self-contained and demonstrable.

**Accepted tradeoffs:** We own auth security (password hashing, token rotation, brute-force protection). MFA and enterprise SSO are deferred.

### Production Path: Managed Auth Provider (Clerk / WorkOS)

Delegate authentication to a managed provider. Our DB retains `organizations` and `memberships` tables for domain-specific fields (pricing, session limits, KPI permissions), referencing external user IDs.

**Why for production:** Auth security becomes the provider's responsibility. Enterprise SSO (SAML/OIDC) is a config toggle. Pre-built UI components (login, org switcher, invites) accelerate shipping.

**Migration strategy:** Auth is isolated to an API middleware layer. Swapping from "verify JWT from our DB" to "verify JWT from Clerk/WorkOS" requires no changes to business logic or analytics queries.

## Data Retention & Scale Considerations

- **Raw events**: Retained for 90 days (configurable per org/plan)
- **Hourly rollups**: Retained for 1 year
- **Daily rollups**: Retained indefinitely
- **Partitioning**: By `org_id` + time bucket for query isolation and efficient pruning
- **Estimated storage**: ~500 bytes/event × 100K events/month/org = ~50MB/month/org raw

## API Design (Key Endpoints)

```
# Aggregated usage (powers overview charts)
GET /api/orgs/:orgId/analytics/overview
  ?period=30d

# Agent detail with individual runs (expandable rows)
GET /api/orgs/:orgId/analytics/agents/:agentId
  ?period=30d&page=1&perPage=50

# Personal dashboard (implicit userId from auth)
GET /api/me/analytics
  ?period=30d

# KPI management
GET    /api/orgs/:orgId/kpis
POST   /api/orgs/:orgId/kpis
PUT    /api/orgs/:orgId/kpis/:kpiId
DELETE /api/orgs/:orgId/kpis/:kpiId
POST   /api/orgs/:orgId/kpis/:kpiId/agents
DELETE /api/orgs/:orgId/kpis/:kpiId/agents/:agentId

# KPI import triggers (post-MVP)
POST /api/orgs/:orgId/kpis/import/monday
POST /api/orgs/:orgId/kpis/import/linear
```


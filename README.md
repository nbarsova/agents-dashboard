# Agent Analytics Dashboard

A customer-facing analytics dashboard providing real-time and historical views of AI agent usage across an organization. Prototype with mock data generated via a seed endpoint.

## Tech Stack

- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS 4, Recharts
- **Backend**: Express 5, Prisma 7, TypeScript
- **Database**: PostgreSQL 16
- **Auth**: JWT + bcrypt, role-based access (admin/member)

## Project Structure

```
├── packages/
│   ├── frontend/         # React SPA (Vite)
│   ├── backend/          # Express API (Prisma)
│   └── shared/           # Shared TypeScript types
├── docker-compose.yml    # PostgreSQL + full-stack dev services
└── package.json          # Root workspaces config
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm 9+

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database

```bash
docker compose up postgres -d
```

This starts PostgreSQL 16 on port **5435** (mapped from container port 5432).

### 3. Configure environment

```bash
cp packages/backend/.env.example packages/backend/.env
```

The default `.env` is pre-configured for the Docker database:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5435/template_db?schema=public"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
JWT_SECRET="dev-secret-change-in-production"
```

### 4. Build shared types and set up the database

```bash
# Build shared types package
npm run build -w @template/shared

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

### 5. Start the application

In two separate terminals:

```bash
# Terminal 1 — backend (http://localhost:3000)
npm run dev:backend

# Terminal 2 — frontend (http://localhost:5173)
npm run dev:frontend
```

Or start everything via Docker Compose (database + backend + frontend with hot reload):

```bash
npm run dev
```

### 6. Seed the database

Once the backend is running, seed the database with mock data:

```bash
curl -X POST http://localhost:3000/api/admin/seed
```

This generates ~3 months of realistic historical data including 2 organizations, users, agents, projects, agent runs, tool calls, and KPIs.

To customize the seed:

```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"months": 3, "eventsPerDay": 150, "variance": 0.3}'
```

To reset all data and re-seed:

```bash
curl -X POST http://localhost:3000/api/admin/seed/reset
```

## Seeded Test Data

The seed creates two organizations with different pricing models so you can test both flows.

### Organization 1: Hogwarts School of Witchcraft and Wizardry

**Pricing plan**: Token-based ($0.00003 per token) — cost is calculated and displayed on dashboards.

| User                | Role   | Email                      |
|---------------------|--------|----------------------------|
| Albus Dumbledore    | Admin  | `dumbledore@hogwarts.edu`  |
| Minerva McGonagall  | Admin  | `mcgonagall@hogwarts.edu`  |
| Rubeus Hagrid       | Member | `hagrid@hogwarts.edu`      |
| Neville Longbottom  | Member | `neville@hogwarts.edu`     |
| Ron Weasley         | Member | `ron@hogwarts.edu`         |
| Hermione Granger    | Member | `hermione@hogwarts.edu`    |
| Harry Potter        | Member | `harry@hogwarts.edu`       |
| Luna Lovegood       | Member | `luna@hogwarts.edu`        |
| Ginny Weasley       | Member | `ginny@hogwarts.edu`       |
| Severus Snape       | Member | `snape@hogwarts.edu`       |

5 agents, 4 projects, 3 KPIs.

### Organization 2: Ministry of Magic

**Pricing plan**: Seat-based (500 session limit) — session usage gauge is displayed instead of cost.

| User                   | Role   | Email                      |
|------------------------|--------|----------------------------|
| Cornelius Fudge        | Admin  | `fudge@ministry.gov`       |
| Arthur Weasley         | Member | `arthur@ministry.gov`      |
| Nymphadora Tonks       | Member | `tonks@ministry.gov`       |
| Kingsley Shacklebolt   | Member | `kingsley@ministry.gov`    |
| Percy Weasley          | Member | `percy@ministry.gov`       |
| Dolores Umbridge       | Member | `umbridge@ministry.gov`    |
| Rufus Scrimgeour       | Member | `scrimgeour@ministry.gov`  |
| Amelia Bones           | Member | `bones@ministry.gov`       |

4 agents, 3 projects, 2 KPIs.

### Password for all seeded users

```
password123
```

### What to test with each user type

| Scenario                          | Log in as                                    |
|-----------------------------------|----------------------------------------------|
| **Admin + token pricing**         | `dumbledore@hogwarts.edu` — sees org overview with cost metrics, trends, channel breakdown, top agents/users |
| **Admin + seat pricing**          | `fudge@ministry.gov` — sees org overview with "N/A (seat plan)" instead of cost |
| **Member + token pricing**        | `hagrid@hogwarts.edu` — sees personal dashboard with cost estimate, no org overview access |
| **Member + seat pricing**         | `arthur@ministry.gov` — sees personal dashboard with session usage gauge instead of cost |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services with Docker Compose |
| `npm run dev:backend` | Start backend dev server |
| `npm run dev:frontend` | Start frontend dev server |
| `npm run build` | Build all packages |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |

## Stopping the database

```bash
docker compose down
```

To also remove the persisted data volume:

```bash
docker compose down -v
```

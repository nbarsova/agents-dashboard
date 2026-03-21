# React + Express + PostgreSQL Template

A monorepo template using npm workspaces for Digital Product School teams.

## Tech Stack

- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS 4
- **Backend**: Express 5, Prisma 7, TypeScript
- **Database**: PostgreSQL 16
- **Tooling**: ESLint 9, Prettier, Husky, lint-staged, Docker

## Project Structure

```
├── packages/
│   ├── frontend/         # React SPA (Vite)
│   ├── backend/          # Express API (Prisma)
│   └── shared/           # Shared TypeScript types
├── docker-compose.yml    # Local development
└── package.json          # Root workspaces config
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm 9+

### Local Development with Docker Database

```bash
# Install dependencies
npm install

# Set up git hooks (for linting/formatting on commit)
npx husky

# Start PostgreSQL database only
docker compose up postgres -d

# Set up environment
cp packages/backend/.env.example packages/backend/.env
```

Update `packages/backend/.env` with the Docker database URL:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/template_db?schema=public
```

Then run:
```bash
# Build shared types
npm run build -w @template/shared

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# Start backend (in one terminal)
npm run dev:backend

# Start frontend (in another terminal)
npm run dev:frontend
```

To stop the database:
```bash
docker compose down
```

### Full Docker Development

```bash
# Start all services (PostgreSQL, backend, frontend)
npm run dev
```
This starts everything with hot reload enabled.


## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services with Docker Compose |
| `npm run dev:backend` | Start backend dev server |
| `npm run dev:frontend` | Start frontend dev server |
| `npm run build` | Build all packages |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |

## Coolify Deployment

### 1. Create PostgreSQL Database

In Coolify, create a new PostgreSQL database resource. Note the connection details.

### 2. Deploy Backend

1. Create a new resource from this repository
2. Set build context to repository root
3. Set Dockerfile path to `packages/backend/Dockerfile`
4. Make sure that "Port exposes" setting matches the EXPOSES value from Dockerfile (e.g. 3000)
5. Configure environment variables:
   - `DATABASE_URL`: PostgreSQL connection string from step 1
   - `PORT`: `3000`
   - `CORS_ORIGIN`: Your frontend URL (e.g., `https://fe.my-team.dpschool.app`)

### 3. Deploy Frontend

1. Create another resource from this repository
2. Set build context to repository root
3. Set Dockerfile path to `packages/frontend/Dockerfile`
4. Make sure that "Port exposes" setting matches the EXPOSES value from Dockerfile (e.g. 80)
5. Configure environmental variable:
   - `VITE_API_URL`: Your backend URL, including "api" suffix, if you're using it for all endpoints (e.g., `https://be.my-team.dpschool.app/api`)
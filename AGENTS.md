# AI Agent Instructions - DPS React Express Template

This file provides context for AI coding agents (Claude Code, GitHub Copilot, OpenAI Codex/ChatGPT, Cursor, etc.).

## Project Overview

Monorepo using npm workspaces with three packages:

- `packages/frontend` - React 19 + Vite 7 + Tailwind CSS 4
- `packages/backend` - Express 5 + Prisma 7 + PostgreSQL
- `packages/shared` - TypeScript types shared between frontend/backend

## Key Patterns

### Backend Routes

Location: `packages/backend/src/routes/`

```typescript
import type { ApiResponse, CreateXRequest, X } from '@template/shared';
import { NextFunction, Request, Response, Router } from 'express';
import { prisma } from '../index';

const router = Router();

router.get('/', async (_req: Request, res: Response<ApiResponse<X[]>>, next: NextFunction) => {
  try {
    const items = await prisma.x.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: items });
  } catch (error) {
    next(error);
  }
});
```

Key points:
- Import types from `@template/shared`
- Use `async/await` with `try-catch` and `next(error)`
- Wrap responses in `ApiResponse<T>` format: `{ data: T, message?: string }`
- Prefix unused params with underscore: `_req`, `_res`

### Frontend API Functions

Location: `packages/frontend/src/api/`

```typescript
import type { ApiResponse, X } from '@template/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function getItems(): Promise<X[]> {
  const response = await fetch(`${API_URL}/items`);
  const result = await handleResponse<ApiResponse<X[]>>(response);
  return result.data;
}
```

Key points:
- Use native `fetch` API
- Import types from `@template/shared`
- Use `handleResponse` helper for error handling
- Return unwrapped data (not the full ApiResponse)

### Shared Types

Location: `packages/shared/src/types/index.ts`

```typescript
// Entity types
export interface EntityName {
  id: string;
  // fields...
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CreateEntityRequest { /* required fields */ }
export interface UpdateEntityRequest { /* optional fields */ }

// Response wrappers (already defined)
export interface ApiResponse<T> { data: T; message?: string; }
export interface ApiErrorResponse { error: string; message: string; }
```

### Database Models

Location: `packages/backend/prisma/schema.prisma`

```prisma
model EntityName {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Key points:
- Use `cuid()` for IDs
- Always include `createdAt` and `updatedAt`
- Use `@unique` for fields that must be unique

## Coding Standards

- **Quotes**: Single quotes
- **Semicolons**: Yes
- **Line width**: 100 characters
- **Indentation**: 2 spaces
- **Trailing commas**: ES5 style
- **Import order**: External deps first, then `@template/*`, then relative

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `TeamMemberCard.tsx` |
| Utility files | camelCase | `formatDate.ts` |
| API files | kebab-case | `team-members.ts` |
| Route files | kebab-case | `team-members.ts` |
| TypeScript interfaces | PascalCase | `TeamMember` |
| Type request/response | PascalCase + suffix | `CreateTeamMemberRequest` |
| Database fields | camelCase | `gitHandle` |
| CSS classes | kebab-case (Tailwind) | `bg-dps-blue-500` |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start full stack via Docker Compose |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run build` | Build all packages |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format with Prettier |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |

## Adding Features

1. **Schema**: Add Prisma model in `packages/backend/prisma/schema.prisma`
2. **Migrate**: Run `npm run db:generate && npm run db:migrate`
3. **Types**: Add interfaces in `packages/shared/src/types/index.ts`
4. **Build shared**: Run `npm run build -w @template/shared`
5. **Routes**: Create route file in `packages/backend/src/routes/`
6. **Register**: Add route in `packages/backend/src/index.ts`
7. **API client**: Create functions in `packages/frontend/src/api/`
8. **UI**: Build React components using the API functions

## Frontend Development Guidelines

- Use Tailwind CSS utility classes
- Font: Plus Jakarta Sans (via `font-sans` class)
- Custom theme values are defined in `index.css` using the `@theme` directive
- Maintain components that you create small, extract new functionality to new components. 
- When you are declaring types needed in the component, extract them to separate types.ts file in the directory next to the component itself 
- When you are declaring constants needed in the component, extract them to separate constants.ts file in the directory next to the component itself.
- If your component uses utility functions independent from component state logic, extract them to separate utils.ts file in the directory next to the component itself. 
- If your component has several state variables, use useReducer hook with actions to extract functionality. 
- If your component is mapping some jsx code to a list of items, extract that code to a separate sub-component.

## Do Not

- Modify files in `prisma/generated/` (auto-generated)
- Commit `.env` files (use `.env.example` as reference)
- Use inline styles (use Tailwind classes)
- Use `require()` (use ES imports)
- Use `any` type without justification

## Documentation Checklist

When making changes, update documentation if:

- [ ] New environment variables → Update README.md, docs/ARCHITECTURE.md and .env.example
- [ ] New patterns or conventions → Update AGENTS.md 
- [ ] Architectural changes → Update docs/ARCHITECTURE.md


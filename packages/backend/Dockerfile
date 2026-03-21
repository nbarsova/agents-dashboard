# Build stage
FROM node:22-alpine AS builder

# Install dependencies required for Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build shared package
RUN npm run build -w @template/shared

# Generate Prisma client
RUN npm run db:generate -w @template/backend

# Build backend
RUN npm run build -w @template/backend

# Production stage
FROM node:20-alpine AS runner

# Install dependencies required for Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Install production dependencies only
RUN npm install --omit=dev

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/packages/backend/prisma.config.ts ./packages/backend/prisma.config.ts

ENV NODE_ENV=production

EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "npm run db:migrate:prod -w @template/backend && npm run start -w @template/backend"]
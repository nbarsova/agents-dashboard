# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# Build shared package
RUN npm run build -w @template/shared

# Build frontend with build-time env var
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -w @template/frontend

# Production stage
FROM nginx:alpine AS runner

# Copy nginx config
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
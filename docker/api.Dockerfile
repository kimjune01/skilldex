FROM node:20-alpine

# Install pnpm and build dependencies for better-sqlite3
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source (will be overridden by volume in dev)
COPY apps/api ./apps/api
COPY packages ./packages
COPY skills ./skills

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["pnpm", "--filter", "@skillomatic/api", "dev"]

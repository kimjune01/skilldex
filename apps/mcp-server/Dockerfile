FROM node:20-slim

# Install pnpm and curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Force cache bust for package.json changes - change this value to force rebuild
ARG CACHEBUST=v17
RUN echo "Cache bust: $CACHEBUST"

# Copy package.json files for needed workspaces
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY packages/mcp/package.json packages/mcp/
COPY apps/mcp-server/package.json apps/mcp-server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY packages/mcp packages/mcp
COPY apps/mcp-server apps/mcp-server

# Build packages in dependency order
RUN pnpm --filter @skillomatic/db build
RUN pnpm --filter @skillomatic/shared build
RUN pnpm --filter @skillomatic/mcp build
RUN pnpm --filter @skillomatic/mcp-server build

# Re-run install to update workspace symlinks to point to built dist/
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/mcp-server

EXPOSE 3001

CMD ["node", "dist/index.js"]

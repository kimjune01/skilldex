FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for all workspaces
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY apps/mcp-server/package.json apps/mcp-server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY apps/mcp-server apps/mcp-server

# Build packages
RUN pnpm --filter @skillomatic/shared build
RUN pnpm --filter @skillomatic/db build
RUN pnpm --filter @skillomatic/mcp-server build

WORKDIR /app/apps/mcp-server

EXPOSE 3001

CMD ["node", "dist/index.js"]

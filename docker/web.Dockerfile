FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source (will be overridden by volume in dev)
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

EXPOSE 5173

CMD ["pnpm", "--filter", "@skilldex/web", "dev", "--host"]

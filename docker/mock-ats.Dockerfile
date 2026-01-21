FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/mock-ats/package.json ./apps/mock-ats/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source (will be overridden by volume in dev)
COPY apps/mock-ats ./apps/mock-ats
COPY packages/shared ./packages/shared

EXPOSE 3001

CMD ["pnpm", "--filter", "@skillomatic/mock-ats", "dev"]

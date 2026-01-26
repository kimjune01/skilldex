/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST Configuration for Skillomatic
 *
 * DEPLOYMENT:
 * - Use `/deploy` slash command in Claude Code (NOT `pnpm deploy` directly)
 * - Use `/rollback` to revert to a previous version
 * - Changes to this file trigger full deployment (all services)
 *
 * RELATED FILES:
 * - .claude/commands/deploy.md   - Deploy command (has target mapping table)
 * - .claude/commands/rollback.md - Rollback command
 *
 * SERVICES:
 * - Api + ApiRouter: Lambda function with CloudFront router
 * - Web: Static site on CloudFront
 * - McpService: ECS Fargate for SSE streaming support
 *
 * SECRETS (set via `pnpm sst secret set <name> <value> --stage production`):
 * - JwtSecret, TursoDatabaseUrl, TursoAuthToken
 * - NangoSecretKey, NangoPublicKey
 * - GoogleClientId, GoogleClientSecret
 */

export default $config({
  app(input) {
    return {
      name: "skillomatic",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "us-west-2",
        },
      },
    };
  },
  async run() {
    // Domain configuration
    const domain = "skillomatic.technology";
    const useCustomDomain = true; // Route53 nameservers configured

    // Import secrets from environment
    const jwtSecret = new sst.Secret("JwtSecret");
    const tursoUrl = new sst.Secret("TursoDatabaseUrl");
    const tursoToken = new sst.Secret("TursoAuthToken");
    const nangoSecretKey = new sst.Secret("NangoSecretKey");
    const nangoPublicKey = new sst.Secret("NangoPublicKey");
    const googleClientId = new sst.Secret("GoogleClientId");
    const googleClientSecret = new sst.Secret("GoogleClientSecret");
    const githubToken = new sst.Secret("GithubToken");

    // Email - AWS SES for transactional emails
    const email = new sst.aws.Email("Email", {
      sender: domain,
      dmarc: "v=DMARC1; p=quarantine;",
    });

    // API subdomain
    const apiDomain = `api.${domain}`;

    // API - Hono on Lambda with custom domain
    const api = new sst.aws.Function("Api", {
      handler: "apps/api/src/lambda.handler",
      runtime: "nodejs20.x",
      timeout: "30 seconds",
      memory: "1024 MB", // Increased for faster cold starts
      url: {
        cors: {
          // Allow web app, localhost dev, and browser extensions
          // Browser extensions use chrome-extension:// origin which requires "*" or explicit listing
          // Since extension IDs vary per user, we use "*" for origins
          allowOrigins: ["*"],
          allowCredentials: false, // Must be false when allowOrigins is "*"
          allowMethods: ["*"],
          allowHeaders: ["*"],
        },
      },
      nodejs: {
        // Install native deps for Lambda (Linux x64)
        install: ["@libsql/linux-x64-gnu", "@libsql/client", "better-sqlite3"],
      },
      link: [jwtSecret, tursoUrl, tursoToken, nangoSecretKey, nangoPublicKey, googleClientId, googleClientSecret, githubToken, email],
      environment: {
        NODE_ENV: "production",
        NANGO_HOST: "https://api.nango.dev",
        // Web URL for email links
        WEB_URL: useCustomDomain ? `https://${domain}` : "",
        // API URL for OAuth redirect URIs (behind CloudFront, host header is Lambda URL)
        API_URL: useCustomDomain ? `https://${apiDomain}` : "",
        // Git hash for version tracking
        GIT_HASH: process.env.GIT_HASH || "unknown",
      },
    });

    // Custom domain for API using CloudFront (for proper SSL)
    const apiRouter = useCustomDomain ? new sst.aws.Router("ApiRouter", {
      domain: apiDomain,
      routes: {
        "/*": api.url,
      },
    }) : undefined;

    // MCP Server - ECS Fargate for SSE support (Lambda doesn't support streaming)
    const mcpDomain = `mcp.${domain}`;

    const vpc = new sst.aws.Vpc("McpVpc", {
      nat: "ec2", // Use NAT instance instead of NAT Gateway ($45/mo → ~$3/mo)
    });

    const cluster = new sst.aws.Cluster("McpCluster", { vpc });

    const mcpService = new sst.aws.Service("McpService", {
      cluster,
      cpu: "0.25 vCPU",
      memory: "0.5 GB",
      scaling: { min: 1, max: 2 },
      image: {
        context: ".",
        dockerfile: "apps/mcp-server/Dockerfile",
      },
      link: [tursoUrl, tursoToken],
      environment: {
        NODE_ENV: "production",
        PORT: "3001",
        GIT_HASH: process.env.GIT_HASH || "unknown",
      },
      loadBalancer: {
        domain: useCustomDomain ? mcpDomain : undefined,
        rules: [
          { listen: "80/http", redirect: "443/https" },
          { listen: "443/https", forward: "3001/http" },
        ],
      },
      health: {
        command: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        interval: "30 seconds",
        timeout: "5 seconds",
        startPeriod: "60 seconds",
      },
    });

    // Web - Static site on CloudFront
    const web = new sst.aws.StaticSite("Web", {
      path: "apps/web",
      build: {
        command: "pnpm build",
        output: "dist",
      },
      domain: useCustomDomain ? domain : undefined,
      environment: {
        // Use custom API domain in production, Lambda URL otherwise
        VITE_API_URL: useCustomDomain ? `https://${apiDomain}` : api.url,
        // MCP endpoint for ChatGPT web connector
        VITE_MCP_URL: useCustomDomain ? `https://${mcpDomain}/mcp` : `${mcpService.url}/mcp`,
      },
    });

    return {
      api: useCustomDomain ? `https://${apiDomain}` : api.url,
      web: web.url,
      mcp: useCustomDomain ? `https://${mcpDomain}` : mcpService.url,
      domain: useCustomDomain ? `https://${domain}` : "Custom domain not configured",
    };
  },
});

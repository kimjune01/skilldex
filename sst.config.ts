/// <reference path="./.sst/platform/config.d.ts" />

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
          allowOrigins: useCustomDomain
            ? [`https://${domain}`, "http://localhost:5173", "http://localhost:4173"]
            : ["*"],
          allowCredentials: true,
          allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
          allowHeaders: ["Content-Type", "Authorization"],
        },
      },
      nodejs: {
        // Install native deps for Lambda (Linux x64)
        install: ["@libsql/linux-x64-gnu", "@libsql/client", "better-sqlite3"],
      },
      link: [jwtSecret, tursoUrl, tursoToken, nangoSecretKey, nangoPublicKey, googleClientId, googleClientSecret, email],
      environment: {
        NODE_ENV: "production",
        NANGO_HOST: "https://api.nango.dev",
        // Set DB env vars directly so they're available at module load time
        TURSO_DATABASE_URL: tursoUrl.value,
        TURSO_AUTH_TOKEN: tursoToken.value,
        // Google OAuth
        GOOGLE_CLIENT_ID: googleClientId.value,
        GOOGLE_CLIENT_SECRET: googleClientSecret.value,
        // Web URL for email links
        WEB_URL: useCustomDomain ? `https://${domain}` : "",
      },
    });

    // Custom domain for API using CloudFront (for proper SSL)
    const apiRouter = useCustomDomain ? new sst.aws.Router("ApiRouter", {
      domain: apiDomain,
      routes: {
        "/*": api.url,
      },
    }) : undefined;

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
      },
    });

    return {
      api: useCustomDomain ? `https://${apiDomain}` : api.url,
      web: web.url,
      domain: useCustomDomain ? `https://${domain}` : "Custom domain not configured",
    };
  },
});

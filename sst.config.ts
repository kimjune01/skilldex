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

    // API - Hono on Lambda
    const api = new sst.aws.Function("Api", {
      handler: "apps/api/src/lambda.handler",
      runtime: "nodejs20.x",
      timeout: "30 seconds",
      memory: "1024 MB", // Increased for faster cold starts
      url: true, // Public Lambda URL with default CORS
      nodejs: {
        // Install native deps for Lambda (Linux x64)
        install: ["@libsql/linux-x64-gnu", "@libsql/client", "better-sqlite3"],
      },
      link: [jwtSecret, tursoUrl, tursoToken, nangoSecretKey, nangoPublicKey],
      environment: {
        NODE_ENV: "production",
        NANGO_HOST: "https://api.nango.dev",
        // Set DB env vars directly so they're available at module load time
        TURSO_DATABASE_URL: tursoUrl.value,
        TURSO_AUTH_TOKEN: tursoToken.value,
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
        VITE_API_URL: api.url,
      },
    });

    return {
      api: api.url,
      web: web.url,
      domain: useCustomDomain ? `https://${domain}` : "Custom domain not configured",
    };
  },
});

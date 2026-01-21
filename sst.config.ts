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
    const isProd = $app.stage === "production";
    const domain = "skillomatic.technology";
    const webDomain = isProd ? domain : undefined;
    const apiDomain = isProd ? `api.${domain}` : undefined;

    // Import secrets from environment
    const jwtSecret = new sst.Secret("JwtSecret");
    const tursoUrl = new sst.Secret("TursoDatabaseUrl");
    const tursoToken = new sst.Secret("TursoAuthToken");
    const nangoSecretKey = new sst.Secret("NangoSecretKey");
    const nangoPublicKey = new sst.Secret("NangoPublicKey");

    // API - Hono on Lambda with custom domain
    const api = new sst.aws.Function("Api", {
      handler: "apps/api/src/lambda.handler",
      runtime: "nodejs20.x",
      timeout: "30 seconds",
      memory: "512 MB",
      url: {
        cors: {
          allowOrigins: isProd
            ? [`https://${domain}`, `https://www.${domain}`]
            : ["http://localhost:5173", "http://localhost:4173"],
          allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowHeaders: ["Content-Type", "Authorization", "X-Demo-Mode"],
          allowCredentials: true,
        },
      },
      link: [jwtSecret, tursoUrl, tursoToken, nangoSecretKey, nangoPublicKey],
      environment: {
        NODE_ENV: "production",
        NANGO_HOST: "https://api.nango.dev",
        WEB_URL: isProd ? `https://${domain}` : "http://localhost:5173",
      },
    });

    // Custom domain for API (production only)
    const apiRouter = apiDomain
      ? new sst.aws.Router("ApiRouter", {
          domain: apiDomain,
          routes: {
            "/*": api.url,
          },
        })
      : undefined;

    // Web - Static site on CloudFront with custom domain
    const web = new sst.aws.StaticSite("Web", {
      path: "apps/web",
      build: {
        command: "pnpm build",
        output: "dist",
      },
      domain: webDomain,
      environment: {
        VITE_API_URL: apiRouter ? `https://${apiDomain}` : api.url,
      },
    });

    return {
      api: apiRouter ? `https://${apiDomain}` : api.url,
      web: webDomain ? `https://${webDomain}` : web.url,
    };
  },
});

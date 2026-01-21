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
    // Import secrets from environment
    const jwtSecret = new sst.Secret("JwtSecret");
    const tursoUrl = new sst.Secret("TursoDatabaseUrl");
    const tursoToken = new sst.Secret("TursoAuthToken");
    const nangoSecretKey = new sst.Secret("NangoSecretKey");

    // API - Hono on Lambda
    const api = new sst.aws.Function("Api", {
      handler: "apps/api/src/lambda.handler",
      runtime: "nodejs20.x",
      timeout: "30 seconds",
      memory: "512 MB",
      url: true,
      link: [jwtSecret, tursoUrl, tursoToken, nangoSecretKey],
      environment: {
        NODE_ENV: "production",
      },
    });

    // Web - Static site on CloudFront
    const web = new sst.aws.StaticSite("Web", {
      path: "apps/web",
      build: {
        command: "pnpm build",
        output: "dist",
      },
      environment: {
        VITE_API_URL: api.url,
      },
    });

    return {
      api: api.url,
      web: web.url,
    };
  },
});

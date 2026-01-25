import { handle } from 'hono/aws-lambda';
import type { LambdaEvent, LambdaContext } from 'hono/aws-lambda';
import { Resource } from 'sst';

// Set environment variables from SST secrets
// Must happen before app modules are loaded (they read env at load time)
process.env.JWT_SECRET = Resource.JwtSecret.value;
process.env.TURSO_DATABASE_URL = Resource.TursoDatabaseUrl.value;
process.env.TURSO_AUTH_TOKEN = Resource.TursoAuthToken.value;
process.env.NANGO_SECRET_KEY = Resource.NangoSecretKey.value;
process.env.NANGO_PUBLIC_KEY = Resource.NangoPublicKey.value;
process.env.GOOGLE_CLIENT_ID = Resource.GoogleClientId.value;
process.env.GOOGLE_CLIENT_SECRET = Resource.GoogleClientSecret.value;

// Lazy load app to ensure env vars are set first
let appHandler: ReturnType<typeof handle> | null = null;

export const handler = async (event: LambdaEvent, context: LambdaContext) => {
  if (!appHandler) {
    const { app } = await import('./app.js');
    appHandler = handle(app);
  }
  return appHandler(event, context);
};

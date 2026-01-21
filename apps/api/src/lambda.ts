import { handle } from 'hono/aws-lambda';
import { Resource } from 'sst';
import { app } from './app.js';

// Set environment variables from SST secrets
process.env.JWT_SECRET = Resource.JwtSecret.value;
process.env.TURSO_DATABASE_URL = Resource.TursoDatabaseUrl.value;
process.env.TURSO_AUTH_TOKEN = Resource.TursoAuthToken.value;
process.env.NANGO_SECRET_KEY = Resource.NangoSecretKey.value;
process.env.NANGO_PUBLIC_KEY = Resource.NangoPublicKey.value;

// Export the Lambda handler
export const handler = handle(app);

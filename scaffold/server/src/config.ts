import { randomBytes } from 'node:crypto';

try {
  process.loadEnvFile(new URL('../../../.env', import.meta.url));
} catch {
  // no .env, defaults apply
}

const env = (name: string, fallback: string) => process.env[name] ?? fallback;

if (process.env.NODE_ENV === 'production' && !process.env.GRADER_TOKEN) {
  throw new Error('GRADER_TOKEN must be set in production');
}

const apiKeys: Record<string, string> = {
  ws_acme: env('PIGEON_KEY_WS_ACME', 'pk_acme_7d1f0a'),
  ws_globex: env('PIGEON_KEY_WS_GLOBEX', 'pk_globex_c93b22'),
};

export const config = {
  port: Number(env('PORT', '4000')),
  webOrigin: env('WEB_ORIGIN', 'http://localhost:5173'),
  // without GRADER_TOKEN the check endpoints are unreachable instead of open to a known default
  graderToken: process.env.GRADER_TOKEN ?? randomBytes(24).toString('hex'),
  mongoUrl: env('MONGO_URL', 'mongodb://localhost:27017/switchboard'),
  redisUrl: env('REDIS_URL', 'redis://localhost:6379'),
  elasticsearchUrl: env('ELASTICSEARCH_URL', 'http://localhost:9200'),
  workspaces: Object.keys(apiKeys),
  pigeon: {
    url: env('PIGEON_URL', 'http://localhost:4010'),
    webhookSecret: env('PIGEON_WEBHOOK_SECRET', 'whsec_pigeon_dev'),
    apiKeys,
  },
  oidc: {
    issuer: env('OIDC_ISSUER', 'http://localhost:4020'),
    clientId: env('OIDC_CLIENT_ID', 'switchboard-web'),
    clientSecret: env('OIDC_CLIENT_SECRET', 'dev-secret-not-for-production'),
    redirectUri: env('OIDC_REDIRECT_URI', 'http://localhost:4000/auth/callback'),
  },
  paybox: {
    url: env('PAYBOX_URL', 'http://localhost:4030'),
    secretKey: env('PAYBOX_SECRET_KEY', 'sk_test_paybox_51c0de'),
    publishableKey: env('PAYBOX_PUBLISHABLE_KEY', 'pk_test_paybox_9a7b3e'),
    webhookSecret: env('PAYBOX_WEBHOOK_SECRET', 'whsec_paybox_dev'),
  },
  sessionTtlSec: 8 * 3600,
  leaseMs: 20_000,
  sendTimeoutMs: 6_000,
};

export const isWorkspace = (id: unknown): id is string =>
  typeof id === 'string' && Object.prototype.hasOwnProperty.call(apiKeys, id);

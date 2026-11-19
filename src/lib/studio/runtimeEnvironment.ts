
import {
  DCS_RUNTIME_CONFIG,
  type RuntimeConfig
} from './runtimeComposition';
import { verifiedArtistPreviewOrigin } from './artistPreviewOrigin';

const PRODUCTION_ORIGIN = 'https://www.tidesofknowing.com';

const COMMUNITY_TARGETS = {
  staging: {
    origin:
      'https://feature-deck-creator-studio-m3g9.tidesofknowing.pages.dev',
    supabase:
      'https://utzcmbidotxgmulguzxo.supabase.co'
  },
  production: {
    origin: PRODUCTION_ORIGIN,
    supabase:
      'https://vbdqvjvhjleqdadiiqjx.supabase.co'
  }
} as const;

/**
 * Provider flags come only from trusted bindings.
 * Community requires an explicitly supplied, exact request origin,
 * deployment target and Supabase project.
 */
export function studioRuntimeConfiguration(
  env: Record<string, unknown> = {},
  requestOrigin?: string
): RuntimeConfig {
  if (env.STUDIO_RUNTIME_ENABLED !== 'true') {
    return DCS_RUNTIME_CONFIG;
  }

  const raw = env.STUDIO_RUNTIME_CONFIG_JSON;

  if (typeof raw !== 'string' || raw.length > 4000) {
    throw Error('Studio runtime configuration missing.');
  }

  const value = JSON.parse(raw);

  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== 'object'
  ) {
    throw Error('Invalid Studio runtime configuration.');
  }

  const allowed = [
    'services',
    'exchange',
    'community',
    'exports',
    'artists',
    'artistPortfolio',
    'artistConversations',
    'recipientId',
    'historyPolicy'
  ];

  if (Object.keys(value).some(key => !allowed.includes(key))) {
    throw Error('Unsupported runtime configuration.');
  }

  const config: RuntimeConfig = {
    origin: PRODUCTION_ORIGIN
  };

  for (
    const key of allowed.slice(0, 7) as Array<
      | 'services'
      | 'exchange'
      | 'community'
      | 'exports'
      | 'artists'
      | 'artistPortfolio'
      | 'artistConversations'
    >
  ) {
    if (
      value[key] !== undefined &&
      typeof value[key] !== 'boolean'
    ) {
      throw Error('Explicit provider flags required.');
    }

    config[key] = value[key] === true;
  }

  if(config.artistConversations&&!config.artistPortfolio)throw Error('Conversations require artist portfolio configuration.');

  if (config.exports && env.STUDIO_DEPLOYMENT_TARGET === 'lexicon-preview') {
    const origin = 'https://tidesofknowing-dcs-lexicon-preview.tidesofknowing.workers.dev';
    if (requestOrigin !== origin || env.PUBLIC_SUPABASE_URL !== 'https://utzcmbidotxgmulguzxo.supabase.co' || config.services || config.exchange || config.community || config.artists || config.artistPortfolio) {
      throw Error('Lexicon exports require the isolated preview origin, database and disabled external services.');
    }
    config.origin = origin;
  }

  // Preserve the previous default for non-Community providers.
  if (config.artistPortfolio) {
    config.origin = verifiedArtistPreviewOrigin(
      requestOrigin ?? PRODUCTION_ORIGIN
    );
  }

  if (config.services || config.community) {
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
        .test(value.recipientId ?? '')
    ) {
      throw Error('Verified service recipient configuration required.');
    }

    config.recipientId = value.recipientId;
  }

  if (config.community) {
    if (!['allow', 'deny'].includes(value.historyPolicy)) {
      throw Error('Explicit community history policy required.');
    }

    config.historyPolicy = value.historyPolicy;
  }

  if (
    config.services ||
    config.exchange ||
    config.artists ||
    config.artistPortfolio
  ) {
    const db = env.DCS_EXCHANGE_DB as
      | { connectionString?: unknown }
      | undefined;

    if (
      typeof db?.connectionString !== 'string' ||
      !db.connectionString
    ) {
      throw Error('Restricted DCS_EXCHANGE_DB binding required.');
    }

    config.database = {
      connectionString: db.connectionString
    };
  }

  if (config.community) {
    const target = env.STUDIO_DEPLOYMENT_TARGET;

    if (
      target !== 'staging' &&
      target !== 'production'
    ) {
      throw Error('Community deployment target is not approved.');
    }

    // No origin inference is permitted for Community.
    if (
      typeof requestOrigin !== 'string' ||
      requestOrigin.length === 0
    ) {
      throw Error('Community request origin is required.');
    }

    const approved = COMMUNITY_TARGETS[target];

    if (
      requestOrigin !== approved.origin ||
      env.PUBLIC_SUPABASE_URL !== approved.supabase
    ) {
      throw Error(
        'Community activation is restricted to the approved environment.'
      );
    }
  }

  return config;
}

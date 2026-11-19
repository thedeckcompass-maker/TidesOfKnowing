
import type { SupabaseClient } from '@supabase/supabase-js';

import { prepareArtistPortfolioProvider } from './artistPortfolioProvider';
import { prepareArtistConversationProvider } from './artistConversationProvider';
import { prepareArtistRegistrationProvider } from './artistRegistrationProvider';
import { prepareExchangeWriter } from './exchangeWriter';

import { composeServiceRecords } from './serviceComposition';
import { composeHostedSupport } from './supportComposition';
import { composeProjectExport } from './exportComposition';
import { preparedExchangeSnapshotProvider } from './exchangeSnapshotProvider';

import {
  cloudflareServiceConnection,
  type PgFactory
} from './cloudflareServiceConnection';

export type RuntimeConfig = {
  services?: boolean;
  exchange?: boolean;
  community?: boolean;
  exports?: boolean;
  artists?: boolean;
  artistPortfolio?: boolean;
  artistConversations?: boolean;
  origin?: string;
  recipientId?: string;
  historyPolicy?: 'deny' | 'allow';
  database?: {
    connectionString: string;
  };
};

export const DCS_RUNTIME_CONFIG: Readonly<RuntimeConfig> =
  Object.freeze({
    services: false,
    exchange: false,
    community: false,
    exports: false,
    artists: false,
    artistPortfolio: false,
    artistConversations: false
  });

/**
 * Compose optional Deck Creator Studio providers.
 *
 * Provider activation must come from trusted server configuration.
 * Authentication alone does not establish service entitlement.
 */
export async function composeDcsRuntime(
  locals: any,
  config: RuntimeConfig = DCS_RUNTIME_CONFIG,
  driver?: PgFactory
) {
  const disabled = {
    studioArtistConversationsEnabled: false,
    studioArtistConversationProvider: null,
    studioArtistPortfolioEnabled: false,
    studioArtistPortfolioProvider: null,
    studioArtistRegistrationEnabled: false,
    studioArtistRegistrationProvider: null,
    studioExchangeHostedEnabled: false,
    studioExchangeProvider: null,
    studioServiceRecords: null,
    studioSupportHostedEnabled: false,
    studioSupportProvider: null,
    studioCommunityActivityEnabled: false,
    studioCommunityMemberActionsEnabled: false,
    studioProjectSnapshotProvider: null,
    studioExchangeSnapshotProvider: null
  };

  if(config.artistConversations&&!config.artistPortfolio)throw Error('Conversations require the reviewed artist portfolio contract.');

  const needsPrivateDatabase =
    config.services === true ||
    config.exchange === true ||
    config.artists === true ||
    config.artistPortfolio === true;

  const needsRuntime =
    needsPrivateDatabase ||
    config.community === true ||
    config.exports === true;

  if (!needsRuntime) {
    return disabled;
  }

  const client = locals.supabase as SupabaseClient | undefined;

  if (!client) {
    return disabled;
  }

  const { data, error } = await client.auth.getUser();
  const actor = data.user?.id;

  if (
    error ||
    !actor ||
    actor !== locals.user?.id ||
    actor !== locals.profile?.id ||
    locals.profile?.status !== 'active'
  ) {
    return disabled;
  }

  if (
    config.services === true &&
    !config.recipientId
  ) {
    throw new Error(
      'Service recipient configuration is incomplete.'
    );
  }

  if (
    needsPrivateDatabase &&
    !config.database?.connectionString
  ) {
    throw new Error(
      'Private Studio database configuration is incomplete.'
    );
  }

  let service: any = {};
  let exchange: any = {};
  let artist: any = {};
  let portfolio: any = {};

  if (needsPrivateDatabase) {
    const make =
      driver ?? (await import('./pgDriver')).pgDriver;

    const connection = cloudflareServiceConnection(
      config.database!,
      actor,
      make
    );

    if (config.services === true) {
      service = await composeServiceRecords(locals, {
        enabled: true,
        recipientId: config.recipientId!,
        connection
      });
    }

    if (config.exchange === true) {
      exchange = {
        studioExchangeHostedEnabled: true,
        studioExchangeProvider: prepareExchangeWriter(
          client,
          connection,
          actor
        )
      };
    }

    if (config.artists === true) {
      artist = {
        studioArtistRegistrationEnabled: true,
        studioArtistRegistrationProvider:
          prepareArtistRegistrationProvider(
            connection,
            actor
          )
      };
    }

    if (config.artistPortfolio === true) {
      portfolio = {
        studioArtistPortfolioEnabled: true,
        studioArtistPortfolioProvider:
          prepareArtistPortfolioProvider(
            connection,
            client,
            actor,
            config.origin ?? ''
          )
      };
      if(config.artistConversations===true){Object.assign(portfolio,{studioArtistConversationsEnabled:true,studioArtistConversationProvider:prepareArtistConversationProvider(client,connection,actor)});}
    }
  }

  const community = composeHostedSupport(client, {
    enabled: config.community === true,
    recipientId: config.recipientId,
    historyPolicy: config.historyPolicy
  });

  const exportsProvider = composeProjectExport(client, {
    enabled: config.exports === true,
    exchangeProvider:
      config.exports === true
        ? preparedExchangeSnapshotProvider(client)
        : undefined
  });

  return {
    ...disabled,
    ...service,
    ...exchange,
    ...artist,
    ...portfolio,
    ...community,
    studioCommunityActivityEnabled:
      config.community === true &&
      community.studioSupportHostedEnabled === true,
    studioCommunityMemberActionsEnabled:
      config.community === true &&
      community.studioSupportHostedEnabled === true,
    ...exportsProvider
  };
}

/** Existing provider consumers only; this selects composition, never grants access. */
export function needsDcsRuntime(pathname:string):boolean {
 const path=pathname.endsWith('/')?pathname:pathname+'/';
 // Target-dependent legacy DCS pages/APIs resolve their persisted audience later.
 // Composition is not an access grant; the public parking boundary runs first.
 const dcsParticipation=/^\/api\/community\/(?:posts\/[^/]+(?:\/replies)?|replies\/[^/]+|reports)\/$/.test(path);
 const dcsHistory=/^\/community\/[^/]+(?:\/edit)?\/$/.test(path)&&!['/community/account/','/community/search/','/community/page/','/community/sections/'].includes(path);
 return dcsParticipation||dcsHistory||path.startsWith('/studio/')||path.startsWith('/api/studio/')||path.startsWith('/api/artists/')||['/artists/collaborate/','/artists/visual-design-exchange/','/ask-leilia/admin/studio-artists/','/ask-leilia/admin/studio-services/','/ask-leilia/admin/studio-community/','/community/sections/deck-creator-studio/'].includes(path);
}




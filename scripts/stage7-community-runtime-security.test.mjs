import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const id = '11111111-1111-4111-8111-111111111111';

function load(path, mocks) {
  const source = fs.readFileSync(path, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;

  const mod = { exports: {} };

  vm.runInNewContext(compiled, {
    module: mod,
    exports: mod.exports,
    require: mocks,
    Promise,
    Error,
    Object
  });

  return mod.exports;
}

const runtime = load(
  'src/lib/studio/runtimeComposition.ts',
  () => new Proxy({}, {
    get(_target, name) {
      if (name === 'composeHostedSupport') {
        return (_client, config) => ({
          studioSupportHostedEnabled: config.enabled === true,
          studioSupportProvider:
            config.enabled === true ? {} : null
        });
      }
      if (name === 'composeProjectExport') return () => ({});
      return () => ({});
    }
  })
);

const environment = load(
  'src/lib/studio/runtimeEnvironment.ts',
  name => {
    if (name.includes('runtimeComposition')) {
      return { DCS_RUNTIME_CONFIG: runtime.DCS_RUNTIME_CONFIG };
    }
    if (name.includes('artistPreviewOrigin')) {
      return { verifiedArtistPreviewOrigin: value => value };
    }
    throw Error('Unexpected import: ' + name);
  }
);

const { composeDcsRuntime, DCS_RUNTIME_CONFIG } = runtime;
const { studioRuntimeConfiguration } = environment;

function locals({
  authenticated = true,
  userId = id,
  profileId = id,
  status = 'active'
} = {}) {
  return {
    user: { id: userId },
    profile: { id: profileId, status },
    supabase: {
      auth: {
        getUser: async () => ({
          data: {
            user: authenticated ? { id } : null
          },
          error: null
        })
      }
    }
  };
}

const enabled = {
  community: true,
  recipientId: id,
  historyPolicy: 'deny'
};

function assertDisabled(result) {
  assert.equal(result.studioSupportHostedEnabled, false);
  assert.equal(result.studioCommunityActivityEnabled, false);
  assert.equal(result.studioCommunityMemberActionsEnabled, false);
}

test('Default Community configuration is disabled', async () => {
  assert.equal(DCS_RUNTIME_CONFIG.community, false);
  assertDisabled(await composeDcsRuntime(locals()));
});

test('Missing authenticated user fails closed', async () => {
  assertDisabled(
    await composeDcsRuntime(
      locals({ authenticated: false }), enabled
    )
  );
});

test('Mismatched user identity fails closed', async () => {
  assertDisabled(
    await composeDcsRuntime(
      locals({ userId: cryptoId() }), enabled
    )
  );
});

test('Mismatched profile identity fails closed', async () => {
  assertDisabled(
    await composeDcsRuntime(
      locals({ profileId: cryptoId() }), enabled
    )
  );
});

test('Inactive profile fails closed', async () => {
  assertDisabled(
    await composeDcsRuntime(
      locals({ status: 'inactive' }), enabled
    )
  );
});

test('Explicit authenticated configuration wires Community flags',
  async () => {
    const result = await composeDcsRuntime(locals(), enabled);

    assert.equal(result.studioSupportHostedEnabled, true);
    assert.equal(result.studioCommunityActivityEnabled, true);
    assert.equal(result.studioCommunityMemberActionsEnabled, true);
    assert.ok(result.studioSupportProvider);
  }
);

test('Untrusted runtime environment stays disabled', () => {
  const result = studioRuntimeConfiguration({
    STUDIO_RUNTIME_CONFIG_JSON: JSON.stringify(enabled)
  });

  assert.equal(result.community, false);
});

test('Trusted environment requires explicit Community settings', () => {
  assert.throws(() =>
    studioRuntimeConfiguration({
      STUDIO_RUNTIME_ENABLED: 'true',
      STUDIO_RUNTIME_CONFIG_JSON:
        JSON.stringify({ community: true })
    })
  );
});

const stagingOrigin =
  'https://feature-deck-creator-studio-m3g9.tidesofknowing.pages.dev';

const stagingEnv = {
  STUDIO_RUNTIME_ENABLED: 'true',
  STUDIO_RUNTIME_CONFIG_JSON: JSON.stringify(enabled),
  STUDIO_DEPLOYMENT_TARGET: 'staging',
  PUBLIC_SUPABASE_URL: 'https://utzcmbidotxgmulguzxo.supabase.co'
};

test('Valid trusted staging configuration is parsed', () => {
  const result = studioRuntimeConfiguration(stagingEnv, stagingOrigin);
  assert.equal(result.community, true);
  assert.equal(result.historyPolicy, 'deny');
});

test('Production origin cannot activate Community', () => {
  assert.throws(() =>
    studioRuntimeConfiguration(
      stagingEnv, 'https://www.tidesofknowing.com'
    )
  );
});

test('Missing staging declaration denies Community', () => {
  const {STUDIO_DEPLOYMENT_TARGET, ...env} = stagingEnv;
  assert.throws(() =>
    studioRuntimeConfiguration(env, stagingOrigin)
  );
});

test('Wrong Supabase project denies Community', () => {
  assert.throws(() =>
    studioRuntimeConfiguration({
      ...stagingEnv,
      PUBLIC_SUPABASE_URL:
        'https://vbdqvjvhjleqdadiiqjx.supabase.co'
    }, stagingOrigin)
  );
});

test('Wrong preview origin denies Community', () => {
  assert.throws(() =>
    studioRuntimeConfiguration(
      stagingEnv,
      'https://unapproved-preview.tidesofknowing.pages.dev'
    )
  );
});

function cryptoId() {
  return '22222222-2222-4222-8222-222222222222';
}


const productionOrigin = 'https://www.tidesofknowing.com';

const productionEnv = {
  ...stagingEnv,
  STUDIO_DEPLOYMENT_TARGET: 'production',
  PUBLIC_SUPABASE_URL:
    'https://vbdqvjvhjleqdadiiqjx.supabase.co'
};

test('Valid production Community configuration is accepted', () => {
  const result = studioRuntimeConfiguration(
    productionEnv,
    productionOrigin
  );

  assert.equal(result.community, true);
  assert.equal(result.historyPolicy, 'deny');
});

test('Valid staging Community configuration remains accepted', () => {
  const result = studioRuntimeConfiguration(
    stagingEnv,
    stagingOrigin
  );

  assert.equal(result.community, true);
  assert.equal(result.historyPolicy, 'deny');
});

test('Missing request origin cannot activate Community', () => {
  assert.throws(
    () => studioRuntimeConfiguration(productionEnv),
    /Community request origin is required/
  );

  assert.throws(
    () => studioRuntimeConfiguration(stagingEnv),
    /Community request origin is required/
  );
});

test('Staging target rejects production domain and database', () => {
  const mismatched = {
    ...productionEnv,
    STUDIO_DEPLOYMENT_TARGET: 'staging'
  };

  assert.throws(
    () => studioRuntimeConfiguration(
      mismatched,
      productionOrigin
    ),
    /Community activation is restricted/
  );
});

test('Cross-environment and unapproved combinations are rejected', () => {
  const invalid = [
    [stagingEnv, productionOrigin],
    [productionEnv, stagingOrigin],
    [
      {
        ...productionEnv,
        PUBLIC_SUPABASE_URL:
          'https://utzcmbidotxgmulguzxo.supabase.co'
      },
      productionOrigin
    ],
    [
      {
        ...stagingEnv,
        STUDIO_DEPLOYMENT_TARGET: 'production'
      },
      stagingOrigin
    ],
    [
      {
        ...productionEnv,
        STUDIO_DEPLOYMENT_TARGET: 'unapproved'
      },
      productionOrigin
    ],
    [
      productionEnv,
      'https://tidesofknowing.com'
    ]
  ];

  for (const [env, origin] of invalid) {
    assert.throws(() =>
      studioRuntimeConfiguration(env, origin)
    );
  }
});

test('Community remains disabled by default', () => {
  const result = studioRuntimeConfiguration(
    {
      ...productionEnv,
      STUDIO_RUNTIME_ENABLED: 'false'
    }
  );

  assert.equal(result.community, false);
});

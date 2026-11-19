import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const serverDir = resolve('dist/server');
const config = JSON.parse(readFileSync(resolve(serverDir, 'wrangler.json'), 'utf8'));
const assetDir = resolve(serverDir, config.assets.directory);
assert.ok(existsSync(resolve(serverDir, config.main)), 'Worker entry must exist');
assert.ok(existsSync(assetDir), 'Static assets directory must exist');
assert.ok(relative(assetDir, serverDir).startsWith('..'), 'Server output must not be inside public assets');
assert.equal(config.assets.run_worker_first, true, 'Worker must enforce routing before static fallback');
assert.ok(config.compatibility_flags.includes('nodejs_compat'), 'PostgreSQL needs nodejs_compat');
const privateNames = /SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|DCS_EXCHANGE_DB|(?:STUDIO_PRIVATE_DATABASE|DCS_EXCHANGE_DB)|STUDIO_STRIPE_(?:TEST|LIVE)_(?:SECRET_KEY|WEBHOOK_SECRET)/;
let scripts = 0;
function check(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name);
    if (entry.isDirectory()) check(file);
    else if (/\.(?:js|mjs)$/.test(entry.name)) {
      scripts++;
      assert.ok(!privateNames.test(readFileSync(file, 'utf8')), `Private server configuration reference in client script: ${relative(assetDir, file)}`);
    }
  }
}
check(assetDir);
console.log(`Cloudflare Workers build verified: entry, asset separation, routing, node compatibility, ${scripts} client scripts checked.`);

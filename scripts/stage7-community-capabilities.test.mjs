import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = fs.readFileSync(
  'src/lib/studio/supportCapabilities.ts', 'utf8'
);

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;

let paid = false;
let privateGrant = false;

const access = {
  effectiveStudioAccess: () => paid,
  loadStudioAccess: async () => null
};

const client = {
  from: () => ({
    select() { return this; },
    eq() { return this; },
    async maybeSingle() {
      return {
        data: privateGrant
          ? {
              starts_at: '2020-01-01',
              expires_at: '2099-01-01',
              revoked_at: null
            }
          : null,
        error: null
      };
    }
  })
};

const module = {exports:{}};
const imports = {
  './supportProvider': {supportStore: () => null},
  '../community/auth': {
    isAdminProfile: p => p?.role === 'admin'
  },
  './access': access
};

vm.runInNewContext(compiled, {
  module,
  exports: module.exports,
  require: name => imports[name],
  Date,
  Promise
});

const {supportCapabilities} = module.exports;

async function check(label, profile, expectedGeneral, expectedPrivate) {
  const channels = await supportCapabilities({
    user: {id:'member'},
    profile,
    supabase:client,
    studioSupportHostedEnabled:true,
    studioSupportProvider:{}
  });

  const general = channels.find(c => c.capability === 'general_community');
  const privateChannel = channels.find(c => c.capability === 'private_community');

  assert.equal(general.eligible,expectedGeneral,label);
  assert.equal(privateChannel.eligible,expectedPrivate,label);
  console.log(label + ': PASS');
}

await check('Explore', {id:'member',status:'active',role:'member'}, true,false);

paid=true;
privateGrant=true;
await check('Create with private grant', {id:'member',status:'active',role:'member'}, true,true);

await check('Inactive', {id:'member',status:'inactive',role:'member'}, false,false);

console.log('Stage 7 Community capability checks passed.');

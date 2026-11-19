import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const out=await build({stdin:{contents:"export {studioRuntimeConfiguration} from './src/lib/studio/runtimeEnvironment.ts';export {composeDcsRuntime} from './src/lib/studio/runtimeComposition.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',define:{'import.meta.env':'{}'}});
const m={exports:{}};new Function('module','exports','require',out.outputFiles[0].text)(m,m.exports,createRequire(import.meta.url));
const {studioRuntimeConfiguration,composeDcsRuntime}=m.exports;
const origin='https://tidesofknowing-dcs-lexicon-preview.tidesofknowing.workers.dev';
const env={STUDIO_RUNTIME_ENABLED:'true',STUDIO_DEPLOYMENT_TARGET:'lexicon-preview',PUBLIC_SUPABASE_URL:'https://utzcmbidotxgmulguzxo.supabase.co',STUDIO_RUNTIME_CONFIG_JSON:JSON.stringify({exports:true,services:false,exchange:false,community:false,artists:false,artistPortfolio:false})};
test('explicit preview export activation composes existing providers with all external services off',async()=>{
 const config=studioRuntimeConfiguration(env,origin);assert.equal(config.exports,true);
 const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const providers=await composeDcsRuntime({supabase:{auth:{getUser:async()=>({data:{user:{id}},error:null})}},user:{id},profile:{id,status:'active'}},config);
 assert.equal(typeof providers.studioProjectSnapshotProvider.capture,'function');
 assert.equal(typeof providers.studioExchangeSnapshotProvider.capture,'function');
 assert.equal(providers.studioServiceRecords,null);assert.equal(providers.studioExchangeProvider,null);
 assert.equal(studioRuntimeConfiguration().exports,false);
});
test('preview export activation rejects production database, wrong origin or external-service activation',()=>{
 assert.throws(()=>studioRuntimeConfiguration({...env,PUBLIC_SUPABASE_URL:'https://vbdqvjvhjleqdadiiqjx.supabase.co'},origin));
 assert.throws(()=>studioRuntimeConfiguration(env,'https://www.tidesofknowing.com'));
 assert.throws(()=>studioRuntimeConfiguration({...env,STUDIO_RUNTIME_CONFIG_JSON:JSON.stringify({exports:true,exchange:true})},origin));
});

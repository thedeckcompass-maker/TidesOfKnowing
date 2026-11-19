'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const logs=[],m={exports:{}};const code=buildSync({entryPoints:['src/pages/auth/callback.ts'],bundle:true,platform:'node',format:'cjs',define:{'import.meta.env':'{}'},write:false,logLevel:'silent'}).outputFiles[0].text;
vm.runInNewContext(code,{module:m,exports:m.exports,require,URL,Request,Response,Headers,TextEncoder,TextDecoder,AbortController,crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout,console:{info:x=>logs.push(x),error(){},warn(){},log(){}}});
(async()=>{const checks=[];for(const [query,expected,callsExpected]of [
 ['token_hash=SYNTHETIC_CALLBACK_TOKEN_NOT_A_REAL_CREDENTIAL&type=email&redirectTo=%2Fstudio%2F','/studio/',1],
 ['token_hash=SYNTHETIC_CALLBACK_TOKEN_NOT_A_REAL_CREDENTIAL&type=recovery&redirectTo=%2Fauth%2Fpassword-update%2F','/auth/password-update/',1],
 ['token_hash=SYNTHETIC_CALLBACK_TOKEN_NOT_A_REAL_CREDENTIAL&type=email&redirectTo=https%3A%2F%2Fpreview.invalid','/studio/',1],
 ['code=SYNTHETIC_PKCE_CODE_NOT_A_REAL_CREDENTIAL&redirectTo=%2Fstudio%2F','/studio/',1],
 ['token_hash=short&type=email&redirectTo=%2Fstudio%2F','/auth/login/',0],
 ['token_hash=SYNTHETIC_CALLBACK_TOKEN_NOT_A_REAL_CREDENTIAL&type=admin&redirectTo=%2Fstudio%2F','/auth/login/',0]
 ]){let calls=0;const cookies={headers:()=>[]};const response=await m.exports.GET({url:new URL('https://www.tidesofknowing.com/auth/callback/?'+query),cookies,locals:{supabase:{auth:{verifyOtp:async()=>{calls++;return{error:null}},exchangeCodeForSession:async()=>{calls++;return{error:null}}}}}});assert.equal(response.status,303);assert.equal(new URL(response.headers.get('location'),'https://www.tidesofknowing.com').pathname,expected);assert.equal(calls,callsExpected);checks.push({destination:expected,providerPortCalls:calls});}
 assert(!logs.join('').includes('SYNTHETIC_CALLBACK_TOKEN'));assert(!logs.join('').includes('SYNTHETIC_PKCE_CODE'));const result={passed:true,checks,credentialValuesNotLogged:true,providerPorts:'Synthetic mocks; no network, email or accounts'};fs.writeFileSync('.build-temp/dcs-onboarding-repair-20261118/callback-tests.json',JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));})().catch(e=>{console.error(JSON.stringify({passed:false,error:e.name,check:String(e.message).split('\n')[0]}));process.exitCode=1;});

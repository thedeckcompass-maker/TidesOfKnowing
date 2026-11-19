'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),inspect=require('./lib/dcs-intake-key-diagnostics.cjs');
const ref='kcahcrfdubpoajsfxziv',fake=claims=>[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify(claims)).toString('base64url'),'fake-signature-only'].join('.');
test('legacy format, target validation, whitespace normalization and non-secret diagnostics',()=>{
 const key=fake({ref,role:'service_role'});
 for(const value of [key,' \r\n'+key+'\n ']){const d=inspect(value,ref);assert.equal(d.reason,'ACCEPTED_LEGACY_SERVICE_ROLE_FORMAT');assert.equal(d.projectMatches,true);assert.equal(d.serviceRoleMatches,true);assert(!JSON.stringify(d).includes(key));}
 const cases=[['sb_secret_fake-not-real','MODERN_SECRET_NOT_LEGACY_JWT'],['sb_publishable_fake','PUBLIC_KEY_NOT_SERVICE_ROLE'],['eyJ...••••','MASKED_OR_TRUNCATED_VALUE'],['Bearer '+key,'BEARER_PREFIX_NOT_KEY_ONLY'],[key.slice(0,20)+'\n'+key.slice(20),'INTERNAL_WHITESPACE_OR_INVISIBLE_CHARACTERS'],[key+'\u200B','INTERNAL_WHITESPACE_OR_INVISIBLE_CHARACTERS'],[fake({ref:'other',role:'service_role'}),'PROJECT_REFERENCE_MISMATCH'],[fake({ref,role:'anon'}),'JWT_ROLE_NOT_SERVICE_ROLE'],['ordinary-password','NOT_A_COMPLETE_BASE64URL_JWT']];
 for(const [value,expected] of cases){const d=inspect(value,ref);assert.equal(d.reason,expected);assert(!JSON.stringify(d).includes(value));assert(!Object.keys(d).some(k=>/key|hash|length/i.test(k)));}
});

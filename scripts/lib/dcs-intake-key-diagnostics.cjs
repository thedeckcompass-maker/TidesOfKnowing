'use strict';
// Return format/validation booleans only: never key content, claims, lengths or hashes.
module.exports=function inspectKey(value,projectRef){
 const d={fieldPresent:typeof value==='string'&&value.length>0,format:'unknown',outerWhitespaceRemoved:false,payloadDecodes:false,projectMatches:null,serviceRoleMatches:null,reason:'MISSING_KEY'};
 if(!d.fieldPresent)return d;
 const key=value.trim();d.outerWhitespaceRemoved=key!==value;
 if(!key)return d;
 if(key.startsWith('sb_secret_'))return {...d,format:'modern_secret',reason:'MODERN_SECRET_NOT_LEGACY_JWT'};
 if(key.startsWith('sb_publishable_'))return {...d,format:'publishable',reason:'PUBLIC_KEY_NOT_SERVICE_ROLE'};
 if(/[•…*]/u.test(key))return {...d,reason:'MASKED_OR_TRUNCATED_VALUE'};
 if(/^Bearer\s/i.test(key))return {...d,reason:'BEARER_PREFIX_NOT_KEY_ONLY'};
 if(/[\s\u200B-\u200D\uFEFF]/u.test(key))return {...d,reason:'INTERNAL_WHITESPACE_OR_INVISIBLE_CHARACTERS'};
 const parts=key.split('.');
 if(parts.length!==3||!parts.every(x=>/^[A-Za-z0-9_-]+$/.test(x)))return {...d,reason:'NOT_A_COMPLETE_BASE64URL_JWT'};
 d.format='legacy_jwt';
 let claims;try{claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));if(!claims||typeof claims!=='object'||Array.isArray(claims))throw Error();}catch{return {...d,reason:'JWT_PAYLOAD_NOT_JSON'};}
 d.payloadDecodes=true;d.projectMatches=claims.ref===projectRef;d.serviceRoleMatches=claims.role==='service_role';
 if(!d.projectMatches)return {...d,reason:'PROJECT_REFERENCE_MISMATCH'};
 if(!d.serviceRoleMatches)return {...d,reason:'JWT_ROLE_NOT_SERVICE_ROLE'};
 return {...d,reason:'ACCEPTED_LEGACY_SERVICE_ROLE_FORMAT'};
};

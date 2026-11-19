'use strict';
// Schema-only prerequisite materializer. Never connects to a database.
// Acceptance ACLs are a strict subset: no anonymous grants, no DDL/table-wide
// maintenance rights, no grant options. Original RLS and contracts are retained.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve('.build-temp/dcs-connected-acceptance-20261118');
const c=JSON.parse(fs.readFileSync(path.join(root,'schema-catalog.json'),'utf8'));
if(c.targetProject!=='kcahcrfdubpoajsfxziv')throw Error('Unexpected acceptance identity');
const q=x=>'"'+String(x).replaceAll('"','""')+'"',name=t=>q(t.schema)+'.'+q(t.name);
const sql=[`-- ONLY independent acceptance project kcahcrfdubpoajsfxziv. NOT a production migration.
BEGIN; SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='60s'; SET LOCAL search_path=public,pg_catalog;
DO $$ BEGIN
 IF current_user<>'postgres' OR EXISTS(SELECT 1 FROM auth.users) OR EXISTS(SELECT 1 FROM storage.objects)
 OR to_regclass('public.profiles') IS NOT NULL OR to_regnamespace('studio_private') IS NOT NULL
 THEN RAISE EXCEPTION 'STOP: acceptance bootstrap requires empty target'; END IF;
END $$;
CREATE SCHEMA studio_private AUTHORIZATION postgres;
CREATE ROLE dcs_service_executor NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
REVOKE CREATE ON SCHEMA public FROM PUBLIC,anon,authenticated,dcs_service_executor;
GRANT USAGE ON SCHEMA public,studio_private TO anon,authenticated,dcs_service_executor;
SET LOCAL check_function_bodies=off;
`];
const privileges={a:'INSERT',r:'SELECT',w:'UPDATE',d:'DELETE',D:'TRUNCATE',x:'REFERENCES',t:'TRIGGER',m:'MAINTAIN',X:'EXECUTE',U:'USAGE',C:'CREATE'};
function acl(entries,kind,target,column){
 const lines=[];for(const entry of entries||[]){const match=entry.match(/^([^=]*)=([^/]*)\/(.+)$/);if(!match)throw Error('Unparsed ACL');const [,grantee,codes]=match;if(grantee==='postgres'||grantee==='pg_database_owner')continue;
 if(!['','anon','authenticated','service_role','dcs_service_executor'].includes(grantee))throw Error('Unreviewed grantee '+grantee);
 for(let i=0;i<codes.length;i++){const privilege=privileges[codes[i]];if(!privilege)throw Error('Unparsed privilege');const grantOption=codes[i+1]==='*';if(grantOption)i++;
 if(!['authenticated','dcs_service_executor'].includes(grantee))continue;
 if(kind==='TABLE'&&!['SELECT','INSERT','UPDATE','DELETE'].includes(privilege))continue;
 lines.push(`GRANT ${privilege}${column?' ('+q(column)+')':''} ON ${kind} ${target} TO ${q(grantee)};`);}}
 return lines;
}
for(const t of c.tables){
 if(t.owner!=='postgres')throw Error('Unreviewed table ownership');
 const cols=t.columns.map(a=>{if(a.generated||a.identity)throw Error('Generated column needs review');return q(a.name)+' '+a.type+(a.default?' DEFAULT '+a.default:'')+(a.notnull?' NOT NULL':'');});
 sql.push(`CREATE TABLE ${name(t)} (${cols.join(',\n')});`);
 sql.push(`REVOKE ALL ON TABLE ${name(t)} FROM PUBLIC,anon,authenticated,service_role,dcs_service_executor;`);
 for(const k of (t.constraints||[]).filter(k=>k.type!=='f'&&k.type!=='t'))sql.push(`ALTER TABLE ${name(t)} ADD CONSTRAINT ${q(k.name)} ${k.definition};`);
 if(t.rls)sql.push(`ALTER TABLE ${name(t)} ENABLE ROW LEVEL SECURITY;`);
 if(t.force_rls)sql.push(`ALTER TABLE ${name(t)} FORCE ROW LEVEL SECURITY;`);
 sql.push(...acl(t.acl,'TABLE',name(t)));
 for(const a of t.columns)sql.push(...acl(a.acl,'TABLE',name(t),a.name));
}
for(const t of c.tables){for(const k of (t.constraints||[]).filter(k=>k.type==='f'))sql.push(`ALTER TABLE ${name(t)} ADD CONSTRAINT ${q(k.name)} ${k.definition};`);for(const idx of t.indexes||[])sql.push(idx+';');}
for(const f of c.functions){if(f.owner!=='postgres')throw Error('Unreviewed function owner');sql.push(f.definition.trimEnd().replace(/;?$/,';'));const target=q(f.schema_name)+'.'+q(f.proname)+'('+f.identity_args+')';sql.push(`REVOKE ALL ON FUNCTION ${target} FROM PUBLIC,anon,authenticated,service_role,dcs_service_executor;`);const entries=f.acl?f.acl.slice(1,-1).split(','):['=X/postgres'];sql.push(...acl(entries,'FUNCTION',target));}
for(const t of c.tables)for(const tr of t.triggers||[]){if(tr.enabled!=='O')throw Error('Nondefault trigger state');sql.push(tr.definition+';');}
for(const p of c.policies){const target=q(p.schemaname)+'.'+q(p.tablename);sql.push(`CREATE POLICY ${q(p.policyname)} ON ${target} AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.map(r=>r==='public'?'PUBLIC':q(r)).join(',')}${p.qual?' USING ('+p.qual+')':''}${p.with_check?' WITH CHECK ('+p.with_check+')':''};`);}
for(const tr of c.authTriggers)sql.push(tr.definition+';');
sql.push(`INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('studio-journal-photos','studio-journal-photos',false,1048576,ARRAY['image/jpeg','image/png']);`);
sql.push(`SET LOCAL check_function_bodies=on;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='dcs_service_executor' AND (rolsuper OR rolbypassrls OR rolcanlogin OR rolinherit)) THEN RAISE EXCEPTION 'Unsafe executor'; END IF; END $$;
NOTIFY pgrst,'reload schema'; COMMIT;`);
const output=sql.join('\n');const file=path.join(root,'schema-prerequisites-v4.sql');fs.writeFileSync(file,output,{flag:'wx'});
fs.writeFileSync(path.join(root,'schema-prerequisites-v4.manifest.json'),JSON.stringify({target:c.targetProject,source:c.sourceProject,sha256:crypto.createHash('sha256').update(output).digest('hex'),tables:c.tables.length,functions:c.functions.length,policies:c.policies.length,containsRows:false,acl:'subset: authenticated/executor DML and function execute only; no anonymous or grant-option rights'},null,2),{flag:'wx'});
console.log('Created target-only schema prerequisites: '+c.tables.length+' tables, '+c.functions.length+' functions, '+c.policies.length+' policies.');

import {readFile} from 'node:fs/promises';
import {lexiconAccessPayload} from './lib/lexicon-access-payload.mjs';
// Offline preparation only. Metadata contains the verified new Worker resource
// ID, exact name and accountId; never credentials. No HTTP client is imported.
const [metadataPath,sessionDuration]=process.argv.slice(2);
if(!metadataPath||!sessionDuration){
 console.error('Use: node scripts/prepare-lexicon-access.mjs <verified-worker-metadata.json> <owner-selected-duration>');process.exitCode=1;
}else{
 try{
  const intent=JSON.parse(await readFile(new URL('../config/lexicon-preview-access.json',import.meta.url),'utf8'));
  const worker=JSON.parse(await readFile(metadataPath,'utf8'));
  console.log(JSON.stringify(lexiconAccessPayload(intent,worker,sessionDuration),null,2));
 }catch{console.error('STOP: verified dedicated Worker metadata and owner-selected session duration are required. No hosted action occurred.');process.exitCode=1;}
}

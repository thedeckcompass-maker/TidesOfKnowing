import {preparePostgresServiceRepository,type PrivatePgConnection} from '../../src/lib/studio/postgresServiceRepository';
import {prepareTestProgrammeProvisioning,STAFF,TARGETS} from './dcs-test-programme-provisioning.mjs';
/** Operator composition only. Caller must supply an existing authenticated,
 * verified-TLS production connection; this module never obtains credentials,
 * creates roles or accepts identity from an HTTP request. Not a public API. */
export function prepareTestProgrammeOperation(config:{enabled?:boolean;projectId:string;verifiedStaffId:string;approvalReference:string;connection:PrivatePgConnection}){
 return async(command:any)=>{
  if(config.enabled!==true||config.projectId!=='vbdqvjvhjleqdadiiqjx'||config.verifiedStaffId!==STAFF||!Object.hasOwn(TARGETS,command.ownerId))throw Error('Approved project, assigned staff and fixed target required');
  const repository=preparePostgresServiceRepository(config.connection,STAFF,STAFF,command.ownerId);
  return prepareTestProgrammeProvisioning({enabled:true,actorId:STAFF,approvalReference:config.approvalReference,repository})(command);
 };
}

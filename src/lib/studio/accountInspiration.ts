import {creativeInbox} from './creativeInbox';
export function accountInspiration(value:any){
 if(value===undefined||value===null)return {version:1,entries:[]};
 if(!value||value.version!==1||!Array.isArray(value.entries)||value.entries.length>1000)throw Error('Saved inspiration could not be read safely.');
 for(const entry of value.entries){const {projectLink,...capture}=entry;creativeInbox({creative_inbox_v1:{version:1,entries:[capture]}});if(projectLink!==null&&projectLink!==undefined){if(!projectLink||!/^[a-f0-9-]{36}$/i.test(projectLink.projectId)||projectLink.captureId!==entry.id||!Number.isFinite(Date.parse(projectLink.at))||Object.keys(projectLink).some(k=>!['projectId','captureId','at'].includes(k)))throw Error('An inspiration link could not be verified.');}}
 return structuredClone(value);
}

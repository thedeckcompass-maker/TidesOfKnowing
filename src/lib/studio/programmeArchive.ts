import {STUDIO_PROGRAMME_STATUSES} from './types';
export const PROGRAMME_ARCHIVE_EXTENSION='programme-progress-v1';
/** Creator writing/progress only. Enrolment, schedule unlocks and access grants are never imported. */
export function validateProgrammeProgress(value:unknown,projectId:string):any[]{
 if(!Array.isArray(value)||value.length>12)throw Error('Programme progress is missing or exceeds twelve weeks.');
 const weeks=new Set<number>(),allowed=['project_id','week_number','status','current_task','notes','completed_at','created_at','updated_at'];
 for(const row of value){
  if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(k=>!allowed.includes(k))||row.project_id!==projectId||!Number.isInteger(row.week_number)||row.week_number<1||row.week_number>12||weeks.has(row.week_number)||!STUDIO_PROGRAMME_STATUSES.includes(row.status)||typeof row.current_task!=='string'||row.current_task.length>2000||typeof row.notes!=='string'||row.notes.length>10000||typeof row.updated_at!=='string'||!Number.isFinite(Date.parse(row.updated_at))||!(row.completed_at===null||typeof row.completed_at==='string'&&Number.isFinite(Date.parse(row.completed_at))))throw Error('Programme progress contains an invalid, conflicting or foreign record.');
  if(row.created_at!==undefined&&(typeof row.created_at!=='string'||!Number.isFinite(Date.parse(row.created_at))))throw Error('Programme creation timestamp is invalid.');
  weeks.add(row.week_number);
 }
 return structuredClone(value).sort((a,b)=>a.week_number-b.week_number);
}
export function programmeProgressMarkdown(rows:any[]){return '# Private programme notes and progress\n\nThese are your saved notes and progress. Restoring them does not enrol the new project or unlock its schedule.\n\n'+rows.map(row=>'## Week '+row.week_number+'\n\nStatus: '+row.status.replaceAll('_',' ')+'\n\n### Current task\n\n'+row.current_task+'\n\n### Notes\n\n'+row.notes).join('\n\n');}

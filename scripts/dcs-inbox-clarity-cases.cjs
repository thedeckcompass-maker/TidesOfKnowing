'use strict';
const assert=require('node:assert/strict');
module.exports=async({db,read,command,uid,section,creator,checks,post})=>{
 const second=uid(950),comment=uid(951),report=uid(952);
 await db.exec(`INSERT INTO public.community_posts(id,section_id,author_id,status,studio_chapter,body)VALUES('${second}','${section}','${creator}','published','visual-world','Synthetic visual-world moderation question');INSERT INTO public.community_replies(id,post_id,author_id,status,body)VALUES('${comment}','${second}','${creator}','published','Synthetic visual-world comment');INSERT INTO public.community_reports(id,post_id,status,reason,notes)VALUES('${report}','${second}','open','other','Synthetic flagged content');`);
 let v=await read({pillar:'visual-world'});assert.equal(v.total,3);assert.equal(v.counters.pillars['visual-world'],3);
 const opened=v.rows.find(r=>r.source_id===comment);await command({action:'open',items:[{id:opened.id,version:opened.version}]});v=await read({pillar:'visual-world'});assert.equal(v.total,3);assert.equal(v.counters.pillars['visual-world'],3);assert.equal(v.rows.find(r=>r.id===opened.id).state,'Opened');
 assert.equal((await read({pillar:'visual-world',focus:'reports'})).total,1);assert.equal((await read({focus:'reports'})).counters.pillars['visual-world'],1);
 checks.push('Pillar counts include opened outstanding work and open reports; attention focus applies to both rows and counts');
 const task=v.rows.find(r=>r.source_id===second);await command({action:'done',items:[{id:task.id,version:task.version}]});v=await read({pillar:'visual-world'});assert.equal(v.total,2);assert.equal(v.counters.pillars['visual-world'],2);let done=await read({tab:'done',pillar:'visual-world'});assert.equal(done.total,1);assert.equal(done.counters.pillars['visual-world'],1);assert.equal(done.rows[0].id,task.id);
 await command({action:'hide',reason:'Synthetic targeted hide',items:[{id:opened.id,version:opened.version}]});v=await read({pillar:'visual-world'});assert.equal(v.total,1);assert.equal(v.counters.pillars['visual-world'],1);assert.equal(v.rows[0].kind,'report');assert((await read({tab:'hidden',pillar:'visual-world'})).rows.some(r=>r.source_id===comment));
 const rt=v.rows[0];await command({action:'dismiss',reason:'Synthetic explicit report resolution',items:[{id:rt.id,version:rt.version}]});assert.equal((await read({pillar:'visual-world'})).total,0);assert.equal((await read({tab:'done',pillar:'visual-world'})).total,2);
 checks.push('Completion, hiding and explicit report resolution immediately clear only eligible attention rows and update Completed and Hidden content');
 for(const tab of ['inbox','done','hidden','log']){
  const all=await read({tab});assert.equal(Object.values(all.counters.pillars).reduce((n,x)=>n+x,0),all.total,tab+' all-pillar totals');
  for(const pillar of ['spark','foundation','architecture','expression','visual-world','companion','making','into-the-world']){const v=await read({tab,pillar});assert.equal(v.total,all.counters.pillars[pillar]??0,tab+' pillar count');assert(v.rows.every(r=>r.pillar===pillar),tab+' pillar row isolation');}
 }
 assert((await read({tab:'log',pillar:'visual-world'})).total>0);assert.equal((await read({tab:'log',pillar:'visual-world',month:'2000-01'})).total,0);assert.deepEqual((await read({tab:'log',month:'2000-01'})).counters.pillars,{});
 assert.equal((await read({tab:'done',q:'no-matching-content-zzzz'})).total,0);assert.deepEqual((await read({tab:'done',q:'no-matching-content-zzzz'})).counters.pillars,{});
 const count=(await db.query('SELECT count(*)::int n FROM public.moderation_actions')).rows[0].n;assert.equal((await read({tab:'log'})).total,count);assert.equal((await read({tab:'log'})).total,count);
 checks.push('All four views: each of eight pillars isolates rows and agrees with server counts; log month filters work; empty filters stay empty; history reads never alter audit');
};

import type {APIRoute} from 'astro';
import {sameOriginMutation,studioProjectWriteAccessResponse as studioWriteAccessResponse} from '../../../../../lib/studio/access';
import {validateLocalCardArtwork} from '../../../../../lib/studio/localCardArtwork';
import {blankVisualCard} from '../../../../../lib/studio/visualDesign';
export const prerender=false;
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});
export const POST:APIRoute=async({request,locals,params})=>{
 if((locals as {studioLocalFolderIntegration?:boolean}).studioLocalFolderIntegration!==true)return json({error:'Local artwork saving is not activated in this environment.'},503);
 if(!sameOriginMutation(request))return json({error:'Invalid request origin.'},403);
 const denied=await studioWriteAccessResponse(locals.user,locals.profile,locals.supabase,params.id);if(denied)return denied;
 if(!locals.user||!locals.supabase||!params.id)return json({error:'Project unavailable.'},404);
 const text=await request.text();if(text.length>450000)return json({error:'This artwork preview is too large.'},413);
 try{const input=JSON.parse(text),{data:project}=await locals.supabase.from('studio_projects').select('id,owner_id,settings,updated_at').eq('id',params.id).eq('owner_id',locals.user.id).maybeSingle();if(!project)return json({error:'Project unavailable.'},404);
 const {data:card}=await locals.supabase.from('studio_cards').select('id').eq('project_id',project.id).eq('id',input.cardId).is('deleted_at',null).maybeSingle();if(!card)return json({error:'Choose a card in your own project.'},404);
 const image=validateLocalCardArtwork(input.image),settings=project.settings??{},board=structuredClone(settings.visual_design_v1);
 if(!board?.deckConfigured)throw Error('Choose your shared deck format before adding artwork.');
 const entry=board.cards[card.id]??blankVisualCard();board.cards[card.id]={...entry,front:image.preview,override:{...entry.override,fit:'cover',artX:50+image.x,artY:50+image.y,artZoom:image.zoom*100}};
 const history=Array.isArray(settings.visual_design_history)?[...settings.visual_design_history]:[];
 const canonicalMatches=entry.front===image.preview&&entry.override?.fit==='cover'&&entry.override.artX===50+image.x&&entry.override.artY===50+image.y&&entry.override.artZoom===image.zoom*100;
 if(canonicalMatches&&JSON.stringify(settings.local_artwork_v1?.cards?.[card.id])===JSON.stringify(image))return json({updatedAt:project.updated_at,image,message:'These artwork choices are already saved to this card.'});
 if(input.expectedUpdatedAt!==project.updated_at)return json({error:'Your project changed. Keep this page open and review the saved version before trying again.'},409);
 history.push({saved_at:project.updated_at,board:settings.visual_design_v1});
 const refs={version:1,cards:{...(settings.local_artwork_v1?.cards??{}),[card.id]:image}},next={...settings,local_artwork_v1:refs,visual_design_v1:board,visual_design_history:history};
 if(JSON.stringify(next).length>6500000)throw Error('This project needs an independent backup before more can be saved. No history was removed.');
 const result=await locals.supabase.from('studio_projects').update({settings:next}).eq('id',project.id).eq('owner_id',locals.user.id).eq('updated_at',project.updated_at).select('updated_at').maybeSingle();
 if(result.error||!result.data)return json({error:'Save was not confirmed. Your selected image and choices remain on this page.'},409);
 return json({updatedAt:result.data.updated_at,image,message:'Artwork preview and position saved to this card. Your full-size original stays in your folder.'});
 }catch(e){return json({error:(e as Error).message},400)}
};

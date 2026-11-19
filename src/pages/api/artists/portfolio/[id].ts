import type {APIRoute} from 'astro';
import {artistPortfolioStore} from '../../../../lib/studio/artistPortfolioProvider';
export const prerender=false;
export const GET:APIRoute=async({locals,params})=>{if(!locals.user||locals.profile?.id!==locals.user.id||locals.profile.status!=='active')return new Response('Not found',{status:404});const store=artistPortfolioStore(locals),bytes=await store?.preview(locals.user.id,params.id);return bytes?new Response(bytes as BodyInit,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}}):new Response('Not found',{status:404})};

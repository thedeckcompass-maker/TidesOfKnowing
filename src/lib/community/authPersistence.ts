import type { AstroCookies } from 'astro';
export const REMEMBER_COOKIE='tok-auth-persistence';
export const REMEMBER_SECONDS=30*24*60*60;
export function chooseAuthPersistence(cookies:AstroCookies,request:Request,remember:boolean,now=Date.now()){
 const until=remember?now+REMEMBER_SECONDS*1000:0;
 cookies.set(REMEMBER_COOKIE,String(until),{path:'/',httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:'lax',...(remember?{maxAge:REMEMBER_SECONDS,expires:new Date(until)}:{})});
}
export function authCookieOptions(options:Record<string,any>,cookies:AstroCookies,now=Date.now()){
 // Preserve SDK deletion instructions, including obsolete token chunks.
 if(options.maxAge===0)return options;
 if(cookies.get(REMEMBER_COOKIE)===undefined)return options; // Preserve existing sessions without an explicit new preference.
 const until=Number(cookies.get(REMEMBER_COOKIE)?.value??0);
 const {maxAge:_maxAge,expires:_expires,...base}=options;
 if(Number.isFinite(until)&&until>now&&until<=now+REMEMBER_SECONDS*1000){return {...base,maxAge:Math.max(1,Math.floor((until-now)/1000)),expires:new Date(until)};}
 return base;
}

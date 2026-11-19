/** Presentation only. Section IDs, access and stored content are unchanged. */
export const COMMUNITY_SECTION_MEANINGS:Record<string,string>={spark:'Idea & purpose',foundation:'Audience & experience',architecture:'Structure & systems',expression:'Cards & writing','visual-world':'Artwork & visual language',companion:'Guidebook & use',making:'Print & production','into-the-world':'Publishing & launch'};
export const communityInitials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('')||'M';
export function communityTime(value:string){
 const time=Date.parse(value);if(!Number.isFinite(time))return '';
 const minutes=Math.max(0,Math.floor((Date.now()-time)/60000));
 return minutes<1?'Just now':minutes<60?`${minutes}m`:minutes<1440?`${Math.floor(minutes/60)}h`:new Date(time).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
}
export const communityFullTime=(value:string)=>Number.isFinite(Date.parse(value))?new Date(value).toUTCString():'';

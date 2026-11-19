/** Exact existing deployment origins only. Never accept forwarded headers or caller-configured hosts. */
export const ARTIST_PREVIEW_ORIGINS=Object.freeze(['https://www.tidesofknowing.com','https://tidesofknowing-consolidated.tidesofknowing.workers.dev'] as const);
export function verifiedArtistPreviewOrigin(origin:string):string{
 if(!(ARTIST_PREVIEW_ORIGINS as readonly string[]).includes(origin))throw Error('Private artist previews are unavailable on this origin.');
 return origin;
}

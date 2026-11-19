import presentation from '../../data/studio/approved-public/presentation.json';
import {studioExploreHref} from '../../data/studio/creator-guidance.mjs';
/** Only trusted, pinned presentation fragments are inserted; no request HTML. */
export function approvedPublicHtml(page:keyof typeof presentation,authenticated=false){
 return presentation[page].html.replaceAll('@@JOIN@@',studioExploreHref(authenticated).replaceAll('&','&amp;'));
}

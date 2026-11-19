import qr from './vendor/qrcode.mjs';
import {directMediaUrl,preparedVisualImage,validatedVisualStyle,type VisualBoard,type VisualCard,type VisualStyle} from './visualDesign';
import {sharedVisual as effectiveVisual} from './deckDesign';
import {artworkInstructions,productionSpecification,qrBounds} from './productionSpecification';
export function qrDestination(card:Partial<VisualCard>){return card.qrPlacement??'card';}
export function visualQrSvg(card:Partial<VisualCard>){if(!card.url||qrDestination(card)==='neither')return '';const code=qr(0,'M');code.addData(directMediaUrl(card.url));code.make();return code.createSvgTag({cellSize:4,margin:16,scalable:true});}
const escape=(s:unknown)=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
/** Non-destructive working SVG, not an original-image rewrite or certified production output. */
export function workingCardSvg(board:VisualBoard,card:any){
 const original=effectiveVisual(board,card.id),spec=productionSpecification(original),v=board.cards[card.id];if(!spec||!v)return '';const s=validatedVisualStyle({...original,sizePreset:'legacy'}) as VisualStyle;if(v.front)preparedVisualImage(v.front);
 const t=spec.trim,q=qrBounds(s);const parts=[`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${spec.width}in" height="${spec.height}in" viewBox="0 0 ${spec.width} ${spec.height}"><title>${escape(card.title)}: working card preview, not print-ready</title><defs><clipPath id="canvas"><rect width="${spec.width}" height="${spec.height}"/></clipPath></defs><rect width="100%" height="100%" fill="${s.background}"/>`];
 if(v.front)parts.push(`<foreignObject width="${spec.width}" height="${spec.height}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;overflow:hidden"><img src="${escape(v.front)}" alt="Card artwork" style="width:100%;height:100%;object-fit:${s.fit};object-position:${s.artX}% ${s.artY}%;transform:scale(${s.artZoom/100});transform-origin:${s.artX}% ${s.artY}%"/></div></foreignObject>`);
 if(s.elements==='studio'){
  if(s.border!=='none')parts.push(s.border==='full'?`<rect x="${t.x}" y="${t.y}" width="${t.width}" height="${t.height}" fill="none" stroke="${s.borderColor}" stroke-width="0.025"/>`:`<rect x="${t.x}" y="${t.y+t.height-.25}" width="${t.width}" height=".25" fill="${s.borderColor}"/>`);
  for(const [key,text]of [['title',card.title],['number',card.card_number??card.number??'']] as const){const font=s[(key+'Font') as keyof typeof s],size=Number(s[(key+'Size') as keyof typeof s])*t.width/100;if(size)parts.push(`<text x="${t.x+Number(s[(key+'X') as keyof typeof s])*t.width/100}" y="${t.y+Number(s[(key+'Y') as keyof typeof s])*t.height/100}" text-anchor="middle" dominant-baseline="middle" font-family="${escape(font)}" font-size="${size}" fill="${s[(key+'Color') as keyof typeof s]}">${escape(text)}</text>`);}
 }
 if(q&&v.url&&['card','both'].includes(qrDestination(v))){const code=visualQrSvg(v),view=code.match(/viewBox="([^"]+)"/)?.[1],inside=code.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');if(view)parts.push(`<svg x="${t.x+q.x}" y="${t.y+q.y}" width="${q.size}" height="${q.size}" viewBox="${view}">${inside}</svg>`);}
 return parts.join('')+'</svg>';
}
export function visualFiles(project:any,cards:any[]):{path:string;bytes:Uint8Array}[]{
 const board=project.settings?.visual_design_v1 as VisualBoard|undefined;if(!board)return[];const enc=new TextEncoder(),files:{path:string;bytes:Uint8Array}[]=[];
 const add=(path:string,text:string)=>files.push({path,bytes:enc.encode(text)});
 const image=(path:string,value:string)=>{if(value?.startsWith('data:image/jpeg;base64,')){const raw=atob(value.split(',')[1]);files.push({path,bytes:Uint8Array.from(raw,c=>c.charCodeAt(0))});}};
 const lines=["# Visual Design Book — working layout", "Working previews, not print-ready proofs. Keep original production images separately.", "", "## Visual intention", board.notes||"Still exploring", ""];
 add('visual-design/design.json',JSON.stringify(board,null,2));image('visual-design/common-back.jpg',board.commonBack);
 add('visual-design/artwork-instructions.md',artworkInstructions(effectiveVisual(board,cards[0]?.id??'')));add('visual-design/production-specification.json',JSON.stringify(productionSpecification(effectiveVisual(board,cards[0]?.id??'')),null,2));
 for(const [i,ref] of board.references.entries()){image(`visual-design/references/${i+1}.jpg`,ref.image);lines.push(`## Reference ${i+1}`,ref.note,`Rights / source: ${ref.rights}`,'');}
 for(const c of cards){const s=effectiveVisual(board,c.id),v=board.cards[c.id];lines.push(`## ${c.title}`,`Trim: ${s.width} × ${s.height} ${s.unit}`,`Visual responsibility: ${s.elements}; border: ${s.elements==='artwork'?'included in original artwork':s.border}; back: ${s.backMode}`,`Title: ${s.titleFont}, ${s.titleSize}% width at ${s.titleX}%, ${s.titleY}%`,`Number: ${s.numberFont}, ${s.numberSize}% width at ${s.numberX}%, ${s.numberY}%`);if(v){image(`visual-design/cards/${c.id}/front.jpg`,v.front);image(`visual-design/cards/${c.id}/back.jpg`,v.back);const composite=workingCardSvg(board,c);if(composite)add(`visual-design/cards/${c.id}/card-preview.svg`,composite);add(`visual-design/cards/${c.id}/artwork-instructions.md`,artworkInstructions(s));if(v.url){const code=visualQrSvg(v);if(code)add(`visual-design/cards/${c.id}/qr.svg`,code);lines.push(`QR destination: ${qrDestination(v)}`);lines.push(`Optional direct URL: ${v.url}`,`Destination confirmed: ${v.destinationConfirmed}; rights confirmed: ${v.rightsConfirmed}; printed proof confirmed: ${v.proofConfirmed}`);}lines.push(`Component states: ${Object.entries(v.states).map(([k,val])=>`${k}: ${val}`).join('; ')}`);}lines.push('');}
 add('visual-design/specification.md',lines.join('\n'));return files;
}

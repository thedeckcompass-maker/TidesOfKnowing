import registry from '../../data/studio/mpc-template-specifications.json';
import {matchingCardSize,type VisualStyle} from './visualDesign';
const number=(n:number)=>Number(n.toFixed(5));
/** Inches throughout. Centered cut/safe rectangles derived from each inspected template, not a universal inset. */
export function productionSpecification(style:Partial<VisualStyle>){
 const preset=matchingCardSize(style);if(!preset)return null;
 const t=registry.templates[preset.id];
 return {id:preset.id,name:preset.name,width:t.canvas[0],height:t.canvas[1],dpi:t.dpi,
  trim:{x:number((t.canvas[0]-preset.width)/2),y:number((t.canvas[1]-preset.height)/2),width:preset.width,height:preset.height},
  safe:{x:number((t.canvas[0]-t.safe[0])/2),y:number((t.canvas[1]-t.safe[1])/2),width:t.safe[0],height:t.safe[1]},
  source:registry.sourceBase+preset.pdf,sha256:t.sha256,verifiedOn:registry.verifiedOn,issue:('issue' in t?t.issue:null) as string|null,
  rasterSource:'rasterSource' in t?{...t.rasterSource,url:registry.sourceBase+t.rasterSource.file}:null,
  vectorSource:'vectorSource' in t?{...t.vectorSource,url:registry.sourceBase+t.vectorSource.file}:null,
  reconciliation:'reconciliation' in t?t.reconciliation:null,
  pixels:{width:Math.ceil(number(t.canvas[0]*t.dpi)),height:Math.ceil(number(t.canvas[1]*t.dpi))},
  calculatedPixels:{trim:{width:number(preset.width*t.dpi),height:number(preset.height*t.dpi)},safe:{width:number(t.safe[0]*t.dpi),height:number(t.safe[1]*t.dpi)}}};
}
export function qrBounds(style:VisualStyle){
 const spec=productionSpecification(style);if(!spec)return null;
 const x=spec.safe.x-spec.trim.x,y=spec.safe.y-spec.trim.y;
 const size=Math.min(spec.safe.width,spec.safe.height,Math.max(0,style.qrSize)*spec.trim.width/100);
 const left=Math.max(x,Math.min(style.qrX*spec.trim.width/100,x+spec.safe.width-size));
 const top=Math.max(y,Math.min(style.qrY*spec.trim.height/100,y+spec.safe.height-size));
 return {x:number(left),y:number(top),size:number(size),left:left/spec.trim.width*100,top:top/spec.trim.height*100,width:size/spec.trim.width*100};
}
export function artworkInstructions(style:VisualStyle){
 const spec=productionSpecification(style);
 if(!spec)return 'Existing custom size: production geometry has not been verified. Keep existing artwork unchanged; choose a supported template before preparing final production files.';
 const trim=spec.trim,safe=spec.safe;
 return [`${spec.name}: artwork instructions`,`Finished trim: ${trim.width} × ${trim.height} in.`,
  `Full artwork canvas including bleed: ${spec.width} × ${spec.height} in. Extend background artwork to every outer edge.`,
  `Bleed per edge: ${trim.x} in horizontally; ${trim.y} in vertically.`,
  `Safe rectangle: ${safe.width} × ${safe.height} in, starting ${safe.x} in from the left and ${safe.y} in from the top of the full canvas. Keep important writing and imagery inside it.`,
  `Orientation: ${trim.width===trim.height?'square':trim.height>trim.width?'portrait':'landscape'}. Trim aspect ratio: ${trim.width}:${trim.height}.`,
  `Resolution: minimum ${spec.dpi} DPI. Calculated full-canvas pixels at ${spec.dpi} DPI: ${spec.pixels.width} × ${spec.pixels.height}.`,
  ...(spec.rasterSource?[`Printer PSD document confirms a full canvas of ${spec.rasterSource.pixels[0]} × ${spec.rasterSource.pixels[1]} pixels at ${spec.rasterSource.dpi} DPI. Source comparisons accompany the exported specification.`]:[]),
  `Calculated from physical measurements at ${spec.dpi} DPI: trim ${spec.calculatedPixels.trim.width} × ${spec.calculatedPixels.trim.height} pixels; safe rectangle ${spec.calculatedPixels.safe.width} × ${spec.calculatedPixels.safe.height} pixels. These calculations do not override a disputed printer boundary.`,
  style.elements==='artwork'?'Supply a complete PNG or JPEG containing your titles, numbers and borders. Studio will not draw duplicate design elements.':'Supply artwork for Studio-managed titles, numbering and supported borders. The working preview records their positions; original images remain unchanged.',
  'Choose QR placement separately. Card QR overlays stay inside this template’s safe rectangle. Scan a physical proof; size and resolution alone do not verify scan quality.',
  spec.issue?'Production hold: '+spec.issue:'Template dimensions checked against the printer PDF.',
  'Studio image previews, readable manuscripts and working SVGs are not verified print-ready files. Retain full-resolution originals and obtain a printer proof.',
  `Printer: MakePlayingCards. Template measurements checked ${spec.verifiedOn}.`].join('\n\n');
}

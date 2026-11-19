import {preparedVisualImage} from './visualDesign';
import {inspectOriginalImage} from './originalArtwork';
export type LocalCardArtwork={name:string;hash:string;bytes:number;width:number;height:number;preview:string;mode:string;x:number;y:number;zoom:number};
export function validateLocalCardArtwork(value:unknown):LocalCardArtwork{
 const v=value as Partial<LocalCardArtwork>|null;
 if(!v||typeof v!=='object'||Array.isArray(v)||typeof v.name!=='string'||!v.name.trim()||v.name.length>180||/[\\/\x00-\x1f]/.test(v.name)||typeof v.hash!=='string'||!/^[a-f0-9]{64}$/.test(v.hash))throw Error('Choose a valid original image reference.');
 if(Object.keys(v).some(key=>!['name','hash','bytes','width','height','preview','mode','x','y','zoom'].includes(key)))throw Error('Only the image reference, compact preview and layout can be saved. Folder paths and permissions stay on this device.');
 for(const [key,min,max]of [['bytes',1,20*1024*1024],['width',1,16000],['height',1,16000],['x',-25,25],['y',-25,25],['zoom',1,2]] as const)if(typeof v[key]!=='number'||!Number.isFinite(v[key])||v[key]!<min||v[key]!>max)throw Error('The artwork reference or position is invalid.');
 if(v.width!*v.height!>48000000)throw Error('The source image is too large.');
 const preview=preparedVisualImage(v.preview),raw=atob(preview.split(',')[1]??''),info=inspectOriginalImage(Uint8Array.from(raw,c=>c.charCodeAt(0)),'image/jpeg');
 if(!preview||raw.length>300000||info.width>1000||info.height>1000)throw Error('The working preview is too large.');
 return {name:v.name,hash:v.hash,bytes:v.bytes!,width:v.width!,height:v.height!,preview,mode:'external-original',x:v.x!,y:v.y!,zoom:v.zoom!};
}

import {
  COMMUNITY_IMAGE_RULES,
  isAllowedCommunityImage
} from './communityAttachments';

export class CommunityAttachmentError extends Error {
  constructor(message:string) {
    super(message);
    this.name='CommunityAttachmentError';
  }
}

const signatures:Record<string,(b:Uint8Array)=>boolean> = {
  'image/jpeg': b =>
    b.length>=4 &&
    b[0]===0xff && b[1]===0xd8 &&
    b[b.length-2]===0xff && b[b.length-1]===0xd9,

  'image/png': b =>
    b.length>=8 &&
    [137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n),

  'image/webp': b =>
    b.length>=12 &&
    String.fromCharCode(...b.slice(0,4))==='RIFF' &&
    String.fromCharCode(...b.slice(8,12))==='WEBP'
};

export type CheckedCommunityAttachment = {
  bytes:Uint8Array;
  mimeType:'image/jpeg'|'image/png'|'image/webp';
  byteSize:number;
  originalName:string;
};

export async function validateCommunityAttachments(
  files:unknown[]
):Promise<CheckedCommunityAttachment[]> {
  if(files.length>COMMUNITY_IMAGE_RULES.maxImagesPerContribution){
    throw new CommunityAttachmentError(
      'You can attach up to three images.'
    );
  }

  const results:CheckedCommunityAttachment[]=[];

  for(const value of files){
    if(!(value instanceof File)){
      throw new CommunityAttachmentError(
        'Choose a valid image file.'
      );
    }

    if(!isAllowedCommunityImage(value.type,value.size)){
      throw new CommunityAttachmentError(
        'Images must be JPG, PNG or WebP and no larger than 5 MB.'
      );
    }

    const bytes=new Uint8Array(await value.arrayBuffer());
    const signature=signatures[value.type];

    if(!signature||!signature(bytes)){
      throw new CommunityAttachmentError(
        'An image file could not be verified.'
      );
    }

    results.push({
      bytes,
      mimeType:value.type as CheckedCommunityAttachment['mimeType'],
      byteSize:bytes.length,
      originalName:value.name
    });
  }

  return results;
}

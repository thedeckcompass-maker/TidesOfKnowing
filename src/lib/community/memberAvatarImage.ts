import sharp from "sharp";
import { createHash } from "node:crypto";

export const AVATAR_SOURCE_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_STORED_MAX_BYTES = 300000;
export const AVATAR_OUTPUT_SIZE = 256;

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const MAX_INPUT_PIXELS = 40_000_000;

export type ProcessedMemberAvatar = {
  bytes: Uint8Array;
  contentType: "image/jpeg";
  width: 256;
  height: 256;
  byteSize: number;
  sha256: string;
};

export class MemberAvatarImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MemberAvatarImageError";
  }
}

export async function processMemberAvatar(
  input: Uint8Array
): Promise<ProcessedMemberAvatar> {
  if (!(input instanceof Uint8Array) || input.length === 0) {
    throw new MemberAvatarImageError(
      "Choose a photograph to upload."
    );
  }

  if (input.length > AVATAR_SOURCE_MAX_BYTES) {
    throw new MemberAvatarImageError(
      "Choose a photograph smaller than 5 MB."
    );
  }

  let metadata;

  try {
    metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
      animated: false
    }).metadata();
  } catch {
    throw new MemberAvatarImageError(
      "This photograph could not be opened."
    );
  }

  if (
    !metadata.format ||
    !ALLOWED_FORMATS.has(metadata.format) ||
    !metadata.width ||
    !metadata.height ||
    metadata.width < 64 ||
    metadata.height < 64 ||
    metadata.pages && metadata.pages > 1
  ) {
    throw new MemberAvatarImageError(
      "Choose a valid JPG, PNG or WebP photograph."
    );
  }

  let output: Buffer;

  try {
    output = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
      animated: false
    })
      .rotate()
      .resize(
        AVATAR_OUTPUT_SIZE,
        AVATAR_OUTPUT_SIZE,
        {
          fit: "cover",
          position: "centre"
        }
      )
      .flatten({ background: "#ffffff" })
      .jpeg({
        quality: 82,
        mozjpeg: true,
        progressive: false
      })
      .toBuffer();
  } catch {
    throw new MemberAvatarImageError(
      "The photograph could not be processed."
    );
  }

  if (output.length > AVATAR_STORED_MAX_BYTES) {
    throw new MemberAvatarImageError(
      "The processed photograph is too large."
    );
  }

  const sha256 = createHash("sha256")
    .update(output)
    .digest("hex");

  return {
    bytes: new Uint8Array(output),
    contentType: "image/jpeg",
    width: 256,
    height: 256,
    byteSize: output.length,
    sha256
  };
}

/**
 * Stage 7 Community attachment contract.
 * Applies equally to General and Private Community.
 * No storage operations are enabled by this file.
 */

export const COMMUNITY_IMAGE_RULES = {
  maxImagesPerContribution: 3,
  maxBytesPerImage: 5 * 1024 * 1024,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp'
  ],
  requireCaption: false,
  requireAltText: false,
  visibility: 'inherit-contribution',
  storage: 'private',
  publicUrls: false
} as const;

export type CommunityImageAttachment = {
  id: string;
  contributionId: string;
  contributionType: 'discussion' | 'reply';
  storagePath: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  byteSize: number;
  caption: string | null;
  altText: string | null;
  createdAt: string;
};

export function isAllowedCommunityImage(
  mimeType: string,
  byteSize: number
): boolean {
  return COMMUNITY_IMAGE_RULES.allowedMimeTypes.some(
    type => type === mimeType
  ) &&
  Number.isSafeInteger(byteSize) &&
  byteSize > 0 &&
  byteSize <= COMMUNITY_IMAGE_RULES.maxBytesPerImage;
}

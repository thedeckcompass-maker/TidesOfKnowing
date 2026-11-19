import {
  validateCommunityAttachments,
  CommunityAttachmentError
} from './communityAttachmentValidation';

const MAX_PIXELS = 20_000_000;
const MAX_DIMENSION = 8000;
const OUTPUT_DIMENSION = 1600;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

type ImageInfo = {
  width: number;
  height: number;
  format: string;
};

export type CommunityImagesBinding = {
  info(stream: ReadableStream<Uint8Array>): Promise<ImageInfo>;
  input(stream: ReadableStream<Uint8Array>): {
    transform(options: {
      width: number;
      height: number;
      fit: 'scale-down';
    }): {
      output(options: {
        format: 'image/jpeg';
        quality: number;
        anim: false;
      }): Promise<{
        response(): Response;
      }>;
    };
  };
};

export type PreparedCommunityImage = {
  bytes: Uint8Array;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  byteSize: number;
};

function stream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    }
  });
}

export async function prepareCommunityImages(
  files: unknown[],
  images: CommunityImagesBinding | null | undefined
): Promise<PreparedCommunityImage[]> {
  const checked = await validateCommunityAttachments(files);

  if (!checked.length) return [];

  if (!images) {
    throw new CommunityAttachmentError(
      'Image attachments are not available right now.'
    );
  }

  const prepared: PreparedCommunityImage[] = [];

  for (const file of checked) {
    try {
      const info = await images.info(stream(file.bytes));

      if (
        !Number.isSafeInteger(info.width) ||
        !Number.isSafeInteger(info.height) ||
        info.width < 1 ||
        info.height < 1 ||
        info.width > MAX_DIMENSION ||
        info.height > MAX_DIMENSION ||
        info.width * info.height > MAX_PIXELS
      ) {
        throw new CommunityAttachmentError(
          'Choose an image with smaller dimensions.'
        );
      }

      const result = await images
        .input(stream(file.bytes))
        .transform({
          width: OUTPUT_DIMENSION,
          height: OUTPUT_DIMENSION,
          fit: 'scale-down'
        })
        .output({
          format: 'image/jpeg',
          quality: 82,
          anim: false
        });

      const response = result.response();

      if (!response.ok) {
        throw new Error('Image conversion failed');
      }

      const bytes = new Uint8Array(await response.arrayBuffer());

      if (
        bytes.length < 4 ||
        bytes.length > MAX_OUTPUT_BYTES ||
        bytes[0] !== 0xff ||
        bytes[1] !== 0xd8 ||
        bytes[bytes.length - 2] !== 0xff ||
        bytes[bytes.length - 1] !== 0xd9
      ) {
        throw new CommunityAttachmentError(
          'The processed image could not be verified.'
        );
      }

      const outputInfo = await images.info(stream(bytes));

      if (
        !Number.isSafeInteger(outputInfo.width) ||
        !Number.isSafeInteger(outputInfo.height) ||
        outputInfo.width < 1 ||
        outputInfo.height < 1 ||
        outputInfo.width > OUTPUT_DIMENSION ||
        outputInfo.height > OUTPUT_DIMENSION
      ) {
        throw new CommunityAttachmentError(
          'The processed image dimensions could not be verified.'
        );
      }

      prepared.push({
        bytes,
        mimeType: 'image/jpeg',
        width: outputInfo.width,
        height: outputInfo.height,
        byteSize: bytes.length
      });
    } catch (error) {
      if (error instanceof CommunityAttachmentError) throw error;

      throw new CommunityAttachmentError(
        'An image could not be processed. Please choose another.'
      );
    }
  }

  return prepared;
}


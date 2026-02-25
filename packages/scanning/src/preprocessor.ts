import sharp from 'sharp';

export interface PreprocessorOptions {
  maxWidth?: number;
  maxHeight?: number;
  enhanceContrast?: boolean;
}

export interface ProcessedImage {
  base64: string;
  width: number;
  height: number;
  contrastEnhanced: boolean;
}

export class ImagePreprocessor {
  async process(
    imageBuffer: Buffer,
    options: PreprocessorOptions = {}
  ): Promise<ProcessedImage> {
    const { maxWidth = 800, maxHeight = 600, enhanceContrast = false } = options;

    let image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    let resizeOptions: sharp.ResizeOptions = {
      width: Math.min(width, maxWidth),
      height: Math.min(height, maxHeight),
      fit: 'inside',
      withoutEnlargement: true,
    };

    image = image.resize(resizeOptions);

    let contrastEnhanced = false;
    if (enhanceContrast) {
      image = image.linear(1.2, 0);
      contrastEnhanced = true;
    }

    const processedBuffer = await image.toBuffer();
    const base64 = processedBuffer.toString('base64');

    const finalMetadata = await sharp(processedBuffer).metadata();

    return {
      base64,
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
      contrastEnhanced,
    };
  }
}

export default ImagePreprocessor;

import { ImagePreprocessor } from '../preprocessor';
import sharp from 'sharp';

describe('ImagePreprocessor', () => {
  const preprocessor = new ImagePreprocessor();

  it('converts image to base64', async () => {
    const validPng = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    }).png().toBuffer();
    
    const result = await preprocessor.process(validPng);
    expect(result.base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it('normalizes image dimensions to 800x600 max', async () => {
    const largeImage = await sharp({
      create: {
        width: 1200,
        height: 900,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    }).png().toBuffer();
    
    const result = await preprocessor.process(largeImage, { maxWidth: 800, maxHeight: 600 });
    expect(result.width).toBeLessThanOrEqual(800);
    expect(result.height).toBeLessThanOrEqual(600);
  });

  it('enhances contrast for foil cards', async () => {
    const foilCardBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 200, g: 200, b: 200, alpha: 1 }
      }
    }).png().toBuffer();
    
    const result = await preprocessor.process(foilCardBuffer, { enhanceContrast: true });
    expect(result.contrastEnhanced).toBe(true);
  });
});

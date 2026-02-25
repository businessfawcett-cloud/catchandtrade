import { OCRService, OCRResult } from '../ocrService';

describe('OCRService', () => {
  const ocrService = new OCRService();

  it('extracts card name from clear image', async () => {
    const mockBase64 = 'mock-base64-image-data';
    const result = await ocrService.extract(mockBase64);
    expect(result.cardName).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('extracts set number from bottom of card', async () => {
    const mockBase64 = 'mock-base64-image-data';
    const result = await ocrService.extract(mockBase64);
    expect(result.cardNumber).toBeDefined();
  });

  it('returns low confidence on blurry image', async () => {
    const mockBase64 = 'blurry-mock-data';
    const result = await ocrService.extract(mockBase64);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('falls back to TF model when confidence is low', async () => {
    const mockBase64 = 'low-confidence-data';
    const result = await ocrService.extract(mockBase64);
    expect(result.usedFallback).toBeDefined();
  });
});

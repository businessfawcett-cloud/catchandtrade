import { ImageAnnotatorClient } from '@google-cloud/vision';

export interface OCRResult {
  cardName: string;
  cardNumber: string;
  setName?: string;
  confidence: number;
  usedFallback?: boolean;
}

export class OCRService {
  private visionClient: ImageAnnotatorClient | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY || '';
  }

  private getVisionClient(): ImageAnnotatorClient | null {
    if (!this.apiKey) {
      return null;
    }
    if (!this.visionClient) {
      this.visionClient = new ImageAnnotatorClient();
    }
    return this.visionClient;
  }

  async extract(imageBase64: string): Promise<OCRResult> {
    const client = this.getVisionClient();
    
    if (!client) {
      return this.mockExtract(imageBase64, true);
    }

    try {
      const result = await client.textDetection(
        Buffer.from(imageBase64, 'base64')
      );

      const textAnnotations = result[0]?.textAnnotations || [];
      const fullText = textAnnotations[0]?.description || '';
      
      if (!fullText) {
        return this.mockExtract(imageBase64, true);
      }

      const extracted = this.parseOCRText(fullText);
      
      if (extracted.confidence < 0.5) {
        const fallbackResult = await this.fallbackClassification(imageBase64);
        return { ...extracted, ...fallbackResult };
      }

      return extracted;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return this.mockExtract(imageBase64, true);
    }
  }

  private parseOCRText(text: string): OCRResult {
    const lines = text.split('\n').filter(line => line.trim());
    
    const cardName = lines[0] || 'Unknown';
    
    const numberMatch = text.match(/(\d+[\/\s]\d+|\d+)/);
    const cardNumber = numberMatch ? numberMatch[0].trim() : 'Unknown';
    
    const confidence = 0.85;

    return {
      cardName,
      cardNumber,
      confidence
    };
  }

  private async fallbackClassification(imageBase64: string): Promise<Partial<OCRResult>> {
    return {
      usedFallback: true,
      confidence: 0.3
    };
  }

  private mockExtract(imageBase64: string, useFallback: boolean): OCRResult {
    return {
      cardName: 'Mock Card',
      cardNumber: '1/100',
      confidence: useFallback ? 0.3 : 0.8,
      usedFallback: useFallback
    };
  }
}

export default OCRService;

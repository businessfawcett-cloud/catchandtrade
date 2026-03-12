export interface OCRResult {
  text: string;
  confidence: number;
  blocks?: TextBlock[];
}

export interface TextBlock {
  text: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ParsedCardInfo {
  query: string;
  cardNumber?: string;
  setTotal?: number;
  setCode?: string;
  language?: string;
}

export { recognizeCardText } from './provider';
export { parseOCRResult } from './parser';

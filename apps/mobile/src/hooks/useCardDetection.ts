import { useState, useRef, useCallback } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useTextRecognition } from 'react-native-vision-camera-text-recognition';
import { useRunOnJS } from 'react-native-worklets-core';
import { parseOCRResult } from '../lib/ocr/parser';
import type { ParsedCardInfo } from '../lib/ocr/index';

const THROTTLE_MS = 2000;
const SKIP_FRAMES = 4; // Only process every 5th frame

export function useCardDetection() {
  const [parsedCard, setParsedCard] = useState<ParsedCardInfo | null>(null);
  const [isDetected, setIsDetected] = useState(false);
  const lastProcessedRef = useRef(0);

  const { scanText } = useTextRecognition({ language: 'latin' });

  const handleText = useCallback((text: string) => {
    const now = Date.now();
    if (now - lastProcessedRef.current < THROTTLE_MS) return;
    lastProcessedRef.current = now;

    const parsed = parseOCRResult(text);
    // Detect if we found a card number OR a meaningful card name (3+ chars)
    if (parsed.cardNumber || (parsed.query && parsed.query.length >= 3)) {
      setParsedCard(parsed);
      setIsDetected(true);
    }
  }, []);

  const runOnJS = useRunOnJS(
    (data: string) => {
      handleText(data);
    },
    [handleText]
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      const results = scanText(frame);
      if (results && results.length > 0) {
        const fullText = results.map((r: any) => r.resultText).filter(Boolean).join('\n');
        if (fullText) {
          runOnJS(fullText);
        }
      }
    },
    [scanText, runOnJS]
  );

  const reset = useCallback(() => {
    setParsedCard(null);
    setIsDetected(false);
    lastProcessedRef.current = 0;
  }, []);

  return { frameProcessor, parsedCard, isDetected, reset };
}

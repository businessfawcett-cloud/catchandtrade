import { ParsedCardInfo } from './index';

const COMMON_SET_CODES = [
  'XY', 'SM', 'SS', 'SW', 'SV', 'OB', 'FI', 'DR', 'EV',
  'RU', 'ML', 'NE', 'PC', 'HG', 'LS', 'PL', 'MT', 'DX', 'GE',
  'PR', 'DT', 'FM', 'BK', 'OP', 'NP', 'EC', 'LM', 'FW',
  'RS', 'DE', 'RL', 'TR', 'GS', 'DQ', 'LEGEND', 'PRO',
  'CEL', 'CRE', 'SH', 'PAL', 'PAR', 'PRE', 'CRZ', 'FUT',
  'PGO', 'BRS', 'CR', 'HV', 'TWM', 'PA', 'SHF', 'MCD', 'MCR',
  'SP', 'SSP', 'G1', 'RG', 'STA', 'KSS', 'HL',
];

// OCR character substitution — ML Kit confuses these in small text / digits
const CHAR_SUBS: Record<string, string> = {
  'O': '0', 'o': '0',
  'I': '1', 'l': '1', '|': '1',
  'S': '5', 's': '5',
  'B': '8',
  'Z': '2', 'z': '2',
  'G': '6',
  'T': '7',
  'q': '9',
};

/**
 * Fix common OCR digit misreads: O→0, I→1, S→5, etc.
 */
function fixDigits(raw: string): string {
  return raw.split('').map(ch => CHAR_SUBS[ch] ?? ch).join('');
}

/**
 * Detect language from OCR text using Unicode character ranges.
 * Hiragana: \u3040-\u309F, Katakana: \u30A0-\u30FF, CJK: \u4E00-\u9FFF
 */
function detectLanguage(text: string): 'EN' | 'JA' {
  const jpChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g) || []).length;
  return (jpChars > 5 || (text.length > 0 && jpChars / text.length > 0.1)) ? 'JA' : 'EN';
}

/**
 * Extract card name from Japanese OCR text.
 * Looks for Katakana/Kanji sequences that form Pokemon names.
 */
function extractJPCardName(lines: string[]): string | undefined {
  for (const line of lines) {
    // Skip number-only lines
    if (/^\d+\s*[\/\\]\s*\d+$/.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    if (line.length < 2) continue;

    // Match lines with significant JP characters (Katakana/Kanji)
    const jpChars = (line.match(/[\u30A0-\u30FF\u4E00-\u9FFF]/g) || []).length;
    if (jpChars >= 2) {
      // Extract the JP name portion (Katakana + Kanji + common suffixes like EX, V, VMAX)
      const nameMatch = line.match(/([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s]+(?:\s*(?:EX|GX|V|VMAX|VSTAR|ex))?)/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (name.length >= 2) return name;
      }
    }
  }
  return undefined;
}

export function parseOCRResult(rawText: string): ParsedCardInfo {
  if (!rawText || rawText.trim().length === 0) {
    return { query: '', cardNumber: undefined, setTotal: undefined, setCode: undefined };
  }

  const language = detectLanguage(rawText);

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let cardNumber: string | undefined;
  let setTotal: number | undefined;
  let setCode: string | undefined;
  let query = rawText;

  // Match card number patterns like "045/198", "O45/I98", etc.
  // Allow OCR-confused characters
  const numberMatch = rawText.match(/([0-9OoIlBSZGTq|]{1,4})\s*[\/\\]\s*([0-9OoIlBSZGTq|]{1,4})/);
  if (numberMatch) {
    const leftFixed = fixDigits(numberMatch[1]);
    const rightFixed = fixDigits(numberMatch[2]);
    const leftNum = parseInt(leftFixed, 10);
    const rightNum = parseInt(rightFixed, 10);

    if (!isNaN(leftNum) && leftNum > 0) {
      cardNumber = leftNum.toString();
    }
    if (!isNaN(rightNum) && rightNum > 0 && rightNum <= 500) {
      setTotal = rightNum;
    }
    query = query.replace(numberMatch[0], '');
  }

  // Match promo-style numbers like "XY116", "SWSH076", "BW41", "SVP054"
  if (!cardNumber) {
    const promoMatch = rawText.match(/\b(XY|SWSH|BW|SM|SV|SVP|DP|PL|HGSS)[\s-]?(\d{1,4})\b/i);
    if (promoMatch) {
      const prefix = promoMatch[1].toUpperCase();
      const num = promoMatch[2];
      cardNumber = num;
      // Map promo prefixes to set codes
      const promoSetMap: Record<string, string> = {
        'XY': 'xyp', 'SWSH': 'swshp', 'BW': 'bwp', 'SM': 'smp',
        'SV': 'svp', 'SVP': 'svp', 'DP': 'dpp', 'PL': 'plp', 'HGSS': 'hsp',
      };
      setCode = promoSetMap[prefix] || undefined;
      query = query.replace(promoMatch[0], '');
    }
  }

  // Extract set code
  if (language === 'JA') {
    // JP set codes: S1a, SV1, SV2a, S12a, etc.
    const jpSetMatch = rawText.match(/\b(S[VW]?\d+[a-z]?)\b/i);
    if (jpSetMatch) {
      setCode = jpSetMatch[1];
      query = query.replace(jpSetMatch[0], '');
    }
  } else {
    const upperText = rawText.toUpperCase();
    for (const code of COMMON_SET_CODES) {
      const regex = new RegExp(`\\b${code}(?![a-z])\\b`, 'i');
      if (regex.test(upperText)) {
        setCode = code.toUpperCase();
        const regex2 = new RegExp(`\\b${code}\\b`, 'gi');
        query = query.replace(regex2, '');
        break;
      }
    }
  }

  // For JP cards, extract name early using Katakana/Kanji detection
  if (language === 'JA') {
    const jpName = extractJPCardName(lines);
    if (jpName) {
      return {
        query: jpName.slice(0, 100),
        cardNumber,
        setTotal,
        setCode,
        language: 'JA',
      };
    }
    // Fallback: use raw text cleaned of numbers
    const fallback = rawText.replace(/\d+\s*[\/\\]\s*\d+/g, '').replace(/\s+/g, ' ').trim();
    return {
      query: (fallback || rawText).slice(0, 100),
      cardNumber,
      setTotal,
      setCode,
      language: 'JA',
    };
  }

  // Remove keywords/noise
  // NOTE: Do NOT strip EX, GX, V, VMAX, VSTAR — these are part of card names!
  const keywords = /\b(BASIC|STAGE\s*[12]|POK[EÉ]M[AO]N|TCG|HOLO|RARE|ULTRA RARE|SUPER RARE|PRIME|RESTORED|LEGEND|BREAK|PROMO|COMMON|UNCOMMON|RARE ULTRA|AMAZING RARE|POK[EÉ]M[AO]N\s*TCG|ILLUSTRATOR|SPECIAL ILLUSTRATION|DEBUG|ACE SPEC|PRISM|Radiant|AR|UR|SSR|HOLO RARE|HOLO RARE SECRET|SECRET RARE|ULTRA RARE BREAK|ULTRA RARE HOLO|CLASSIC|WEAKNESS|RESISTANCE|RETREAT|ILLUS\.?|[Il]?lus\.?)/gi;
  query = query.replace(keywords, '');

  // Remove remaining number patterns
  query = query.replace(/([0-9OoIlBSZGTq|]{1,4})\s*[\/\\]\s*([0-9OoIlBSZGTq|]{1,4})/g, '');

  // Extract card name: text before "HP" or before large numbers (like 210)
  // Match noise lines: BASIC (and OCR misreads like BRSIC, DASIC), STAGE 1/2, TRAINER, etc.
  // Also catch any single uppercase word of 4-6 chars (likely a misread card type label)
  const NOISE_LINES = /^([A-Z]{4,8}|BASIC|STAGE\s*[12]|TRAINER|SUPPORTER|ITEM|ENERGY|POK[EÉ]M[AO]N|TCG|POK[EÉ]M[AO]N\s*TCG|NO\.\s*\d+)$/i;
  // Lines that appear in card body text (attacks, rules, etc.) — not the card name
  const BODY_TEXT = /^(weakness|resistance|retreat|l?l?i?l?l?us\.?|illus|damage|attach|attack|discard|shuffle|draw|flip|coin|hand|deck|prize|bench|active|knock|put|search|heal|switch|prevent|reduce|your|this|the|each|if|you|don't|does|isn't|can't|once|during|when|before|after|between|from|into|onto|to|does|doesn't|pokemon|power|ability|rule|energy|choose|place|take|look|may|also|opponent|defending|evolve|evolved|turn|next|end|remaining|check|instead|effect|special|condition)\b/i;
  // Skip illustrator credit lines (e.g. "Illus. Shin Nagasawa", "lus Shin Nagasawa")
  const ILLUS_LINE = /^.{0,5}(illus|lus|ilus)\.?\s/i;
  let cardName: string | undefined;
  for (const line of lines) {
    // Skip known noise lines
    if (NOISE_LINES.test(line.trim())) continue;
    // Skip card body text (attacks, rules, weakness, etc.)
    if (BODY_TEXT.test(line.trim())) continue;
    // Skip illustrator credits
    if (ILLUS_LINE.test(line.trim())) continue;
    // Skip lines with "x2" or "x½" (weakness/resistance values)
    if (/x[2½]/.test(line)) continue;
    // Match "Raichu GX 210 HP" or "Pikachu V  220HP"
    // Allow OCR-confused digits (O for 0, etc.)
    const hpMatch = line.match(/^(.+?)\s+[0-9OoIl]{2,3}\s*HP/i);
    if (hpMatch && hpMatch[1].trim().length >= 2) {
      cardName = hpMatch[1].trim();
      break;
    }
    // Match "Raichu GX" as the first meaningful line (no digits, mostly alpha)
    const alphaRatio = (line.match(/[a-zA-Z]/g) || []).length / line.length;
    if (alphaRatio > 0.6 && line.length >= 3 && line.length <= 40 && !cardName) {
      // Skip lines that are just numbers or card number patterns
      if (!/^\d+\s*[\/\\]\s*\d+$/.test(line) && !/^\d+$/.test(line) && !/^\d+\s*HP$/i.test(line)) {
        cardName = line.replace(/[^a-zA-Z0-9\s\-'é]/g, '').trim();
      }
    }
  }

  query = query.replace(/\s+/g, ' ').trim();

  const cleanLines = query.split('\n').filter(l => l.trim().length > 2);
  if (cleanLines.length > 0) {
    query = cleanLines[0].trim();
  }

  // Prefer the extracted card name over the cleaned query
  if (cardName && cardName.length >= 2) {
    // Strip noise prefixes that OCR may have merged with the name
    // Catches BASIC, BRSIC, DASIC, STAGE 1, TRAINER, etc.
    cardName = cardName
      .replace(/^[A-Z]{4,8}\s+/i, '')
      .replace(/^POK[EÉ]M[AO]N\s+/i, '')
      .replace(/^STAGE\s*[12]\s+/i, '')
      .replace(/^.{0,5}(illus|lus|ilus)\.?\s+/i, '')
      .trim();
    // Reject card names that are just noise words
    const NOISE_NAMES = /^(basic|stage|trainer|supporter|item|energy|pokemon|tcg|attack|damage|weakness|resistance|retreat|hp|no)$/i;
    if (cardName.length >= 2 && !NOISE_NAMES.test(cardName)) {
      query = cardName;
    }
  }

  if (query.length < 2) {
    query = (lines[0] || rawText).slice(0, 100);
  }

  return {
    query: query.slice(0, 100),
    cardNumber,
    setTotal,
    setCode,
    language: 'EN',
  };
}

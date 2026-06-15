/**
 * Smart Report Extractor
 *
 * Three-tier extraction pipeline:
 *   Tier 1 — pdf-parse: direct text extraction from digital PDFs
 *   Tier 2 — Gemini Vision: OCR + structured extraction for scanned PDFs
 *   Tier 3 — OCR.space free API: fallback OCR
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// pdf-parse is a CommonJS module — use require for compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

/** Result from the extraction pipeline */
export interface ExtractionResult {
  method: 'pdf-text' | 'gemini-vision' | 'ocr-space';
  text: string | null;
  structured: StructuredReport | null;
}

/** Structured report from Gemini Vision OCR */
export interface StructuredReport {
  patientInfo?: {
    name?: string;
    age?: number | null;
    sex?: string;
    reportDate?: string;
  };
  labName?: string;
  tests: Array<{
    testName: string;
    value: number;
    unit: string;
    referenceRange?: string;
    flag?: string | null;  // H, L, or null
  }>;
}

// Medical keywords used to validate text quality
const MEDICAL_KEYWORDS = [
  'hemoglobin', 'glucose', 'creatinine', 'wbc', 'rbc', 'platelet',
  'hb', 'cbc', 'blood', 'urine', 'sugar', 'tsh', 'alt', 'ast',
  'cholesterol', 'triglyceride', 'bilirubin', 'sodium', 'potassium',
  'urea', 'hba1c', 'esr', 'mcv', 'mch', 'mchc',
];

/**
 * Clean text: remove non-ASCII, collapse excessive whitespace/newlines.
 */
function cleanText(text: string): string {
  return text
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')   // Replace non-ASCII with space
    .replace(/ {3,}/g, '  ')                 // Collapse 3+ spaces to 2
    .replace(/\n{4,}/g, '\n\n')              // Collapse 4+ newlines to 2
    .trim();
}

/**
 * Check if extracted text is "good enough" to use directly.
 */
function isTextGoodQuality(text: string): boolean {
  if (text.length < 100) return false;

  // Must contain at least some numbers (test values)
  const hasNumbers = /\d+\.?\d*/.test(text);
  if (!hasNumbers) return false;

  // Must contain at least one medical keyword
  const lowerText = text.toLowerCase();
  const hasKeyword = MEDICAL_KEYWORDS.some(kw => lowerText.includes(kw));
  return hasKeyword;
}

/**
 * Strip markdown code fences from an AI response before JSON.parse.
 */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

// ─── TIER 1: Direct PDF Text ─────────────────────────────────

async function extractWithPdfParse(pdfBuffer: Buffer): Promise<ExtractionResult | null> {
  try {
    const data = await pdfParse(pdfBuffer);
    const text = cleanText(data.text || '');

    if (isTextGoodQuality(text)) {
      console.log('📄 Tier 1 (pdf-parse): Good text extracted');
      return { method: 'pdf-text', text, structured: null };
    }

    console.log('📄 Tier 1 (pdf-parse): Text quality insufficient, falling through...');
    return null;
  } catch (error) {
    console.error('📄 Tier 1 (pdf-parse) failed:', error);
    return null;
  }
}

// ─── TIER 2: Gemini Vision OCR ───────────────────────────────

async function extractWithGeminiVision(pdfBuffer: Buffer): Promise<ExtractionResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('🤖 Tier 2 (Gemini Vision): No GEMINI_API_KEY, skipping...');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Send PDF as inline data (Gemini supports PDF natively)
    const pdfBase64 = pdfBuffer.toString('base64');

    const prompt = `These are pages of a Pakistani medical lab report.
Extract ALL lab test results. Return ONLY valid JSON, no markdown:
{
  "patientInfo": { "name": "...", "age": null, "sex": "unknown", "reportDate": "..." },
  "labName": "...",
  "tests": [
    { "testName": "...", "value": 0.0, "unit": "...", "referenceRange": "...", "flag": null }
  ]
}
flag is H (high), L (low), or null. Include ALL tests found.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64,
        },
      },
    ]);

    const responseText = result.response.text();
    const jsonStr = stripMarkdownFences(responseText);
    const parsed: StructuredReport = JSON.parse(jsonStr);

    if (parsed.tests && parsed.tests.length > 0) {
      console.log(`🤖 Tier 2 (Gemini Vision): Extracted ${parsed.tests.length} tests`);
      return { method: 'gemini-vision', text: null, structured: parsed };
    }

    console.log('🤖 Tier 2 (Gemini Vision): No tests found in response');
    return null;
  } catch (error) {
    console.error('🤖 Tier 2 (Gemini Vision) failed:', error);
    return null;
  }
}

// ─── TIER 3: OCR.space Free API ──────────────────────────────

async function extractWithOCRSpace(pdfBuffer: Buffer): Promise<ExtractionResult | null> {
  try {
    const pdfBase64 = pdfBuffer.toString('base64');

    const formData = new URLSearchParams();
    formData.append('base64Image', `data:application/pdf;base64,${pdfBase64}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('filetype', 'PDF');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'helloworld',  // Free tier API key
      },
      body: formData,
    });

    const data: any = await response.json();

    if (data.ParsedResults && data.ParsedResults.length > 0) {
      const fullText = data.ParsedResults
        .map((r: any) => r.ParsedText || '')
        .join('\n');

      const cleaned = cleanText(fullText);

      if (cleaned.length > 50) {
        console.log('🔍 Tier 3 (OCR.space): Text extracted successfully');
        return { method: 'ocr-space', text: cleaned, structured: null };
      }
    }

    console.log('🔍 Tier 3 (OCR.space): Insufficient text');
    return null;
  } catch (error) {
    console.error('🔍 Tier 3 (OCR.space) failed:', error);
    return null;
  }
}

// ─── MAIN EXTRACTION PIPELINE ────────────────────────────────

/**
 * Extract report data from a PDF buffer using a three-tier pipeline.
 * Tries each tier in order until one succeeds.
 */
export async function extractFromReport(pdfBuffer: Buffer): Promise<ExtractionResult> {
  // Ensure we have a proper Buffer
  const buffer = Buffer.isBuffer(pdfBuffer)
    ? pdfBuffer
    : Buffer.from(pdfBuffer);

  // Tier 1: Direct PDF text
  const tier1 = await extractWithPdfParse(buffer);
  if (tier1) return tier1;

  // Tier 2: Gemini Vision OCR
  const tier2 = await extractWithGeminiVision(buffer);
  if (tier2) return tier2;

  // Tier 3: OCR.space
  const tier3 = await extractWithOCRSpace(buffer);
  if (tier3) return tier3;

  // All tiers failed
  throw new Error('All extraction methods failed. The PDF may be corrupted or unreadable.');
}

/**
 * AI Interpreter — Thin HTTP Client
 *
 * Calls the Python AI microservice to interpret lab reports.
 * Falls back to local Gemini-only interpretation if the Python service
 * is unreachable.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { findReferenceRange, classifyValue, ClassificationStatus, MatchedRange } from './ragLookup';

/** Patient profile for age/sex-adjusted interpretation */
export interface PatientProfile {
  age: number;
  sex: string;
  weight?: number;
  conditions?: string[];
}

/** Individual test result in the final interpretation */
export interface InterpretedResult {
  testName: string;
  patientValue: number;
  unit: string;
  normalMin: number | null;
  normalMax: number | null;
  status: ClassificationStatus;
  note: string;
}

/** Final interpretation output */
export interface InterpretationOutput {
  overallClassification: ClassificationStatus;
  verdictMessage: string;
  results: InterpretedResult[];
  extractionMethod: string;
  llmUsed: string;
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Interpret a lab report by calling the Python AI microservice.
 */
export async function interpretReport(
  pdfBuffer: Buffer,
  patientProfile: PatientProfile
): Promise<InterpretationOutput> {
  // Convert PDF buffer to base64 for sending over HTTP
  const buffer = Buffer.isBuffer(pdfBuffer)
    ? pdfBuffer
    : Buffer.from((pdfBuffer as any)?.buffer || pdfBuffer);
  const pdfBase64 = buffer.toString('base64');

  try {
    // Call Python AI service
    const response = await fetch(`${AI_SERVICE_URL}/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdf_base64: pdfBase64,
        patient_profile: {
          age: patientProfile.age,
          sex: patientProfile.sex,
          weight: patientProfile.weight || null,
          conditions: patientProfile.conditions || [],
        },
      }),
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({}));
      const detail = errorData.detail || 'AI service returned an error';
      throw new Error(detail);
    }

    const data: any = await response.json();
    console.log(`✅ AI interpretation complete via Python service (LLM: ${data.llmUsed}, OCR: ${data.extractionMethod})`);

    return {
      overallClassification: data.overallClassification,
      verdictMessage: data.verdictMessage,
      results: data.results,
      extractionMethod: data.extractionMethod,
      llmUsed: data.llmUsed,
    };
  } catch (error: any) {
    // If Python service is unreachable, try local Gemini fallback
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      console.warn('⚠️ Python AI service unreachable, falling back to local Gemini...');
      return localGeminiFallback(pdfBuffer, patientProfile);
    }
    throw error;
  }
}

// ─── LOCAL GEMINI FALLBACK ───────────────────────────────────
// Used only when the Python microservice is down

async function localGeminiFallback(
  pdfBuffer: Buffer,
  patientProfile: PatientProfile
): Promise<InterpretationOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('AI service unavailable. Please try again later.');

  const { age, sex } = patientProfile;

  // Step 1: Detect File Type
  const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from((pdfBuffer as any)?.buffer || pdfBuffer);
  let mimeType = 'application/pdf';
  if (buffer.length > 2 && buffer[0] === 0xFF && buffer[1] === 0xD8) mimeType = 'image/jpeg';
  else if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) mimeType = 'image/png';

  // Step 2: Ask Gemini to extract test values directly from the file
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const extractPrompt = `Extract all lab test results from this medical report.
Return ONLY JSON array, no markdown:
[{ "testName": "...", "value": 0.0, "unit": "..." }]

Rules:
- Only include tests with clear numeric values
- Normalize common aliases (SGPT→ALT, TLC→WBC)
- Leave unit as empty string if not found
- Return empty array [] if no tests found`;

  const documentPart = {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    }
  };

  const extractResult = await model.generateContent([extractPrompt, documentPart]);
  const extractText = extractResult.response.text()
    .replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const rawTests: Array<{ testName: string; value: number; unit: string }> = JSON.parse(extractText);

  if (!rawTests.length) throw new Error('Could not identify test values in this report.');

  // Step 3: RAG lookup + classification
  const results: InterpretedResult[] = rawTests.map(test => {
    const range = findReferenceRange(test.testName, age, sex);
    const status = classifyValue(test.value, range);
    return {
      testName: range?.testName || test.testName,
      patientValue: test.value,
      unit: test.unit || range?.unit || '',
      normalMin: range?.min ?? null,
      normalMax: range?.max ?? null,
      status,
      note: '',
    };
  });

  // Step 4: Generate notes
  const simplified = results.map(r => ({
    testName: r.testName, value: r.patientValue, unit: r.unit,
    normalRange: r.normalMin !== null && r.normalMax !== null ? `${r.normalMin}-${r.normalMax}` : 'N/A',
    status: r.status,
  }));

  try {
    const notesPrompt = `Write a short patient-friendly note for each result.
Simple English. Max 2 sentences each.
Return ONLY JSON array: [{ "testName": "...", "note": "..." }]

Results: ${JSON.stringify(simplified)}`;

    const notesResult = await model.generateContent(notesPrompt);
    const notesText = notesResult.response.text()
      .replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const notes: Array<{ testName: string; note: string }> = JSON.parse(notesText);

    results.forEach(r => {
      const match = notes.find(n => n.testName.toLowerCase() === r.testName.toLowerCase());
      r.note = match?.note || generateFallbackNote(r.testName, r.status);
    });
  } catch {
    results.forEach(r => { r.note = generateFallbackNote(r.testName, r.status); });
  }

  // Step 5: Overall
  const hasCritical = results.some(r => r.status === 'Critical');
  const hasAttention = results.some(r => r.status === 'Needs Attention');
  const overallClassification = hasCritical ? 'Critical' : hasAttention ? 'Needs Attention' : 'Good';

  const verdicts: Record<string, string> = {
    Good: 'Great news! All your results are within normal range. Keep up your healthy lifestyle.',
    'Needs Attention': 'Some results need attention. Please consult your doctor for guidance.',
    Critical: 'Some results require immediate medical attention. Please contact your doctor now.',
  };

  return {
    overallClassification,
    verdictMessage: verdicts[overallClassification] + ' ⚠️ This is AI-generated guidance, not a medical diagnosis.',
    results,
    extractionMethod: 'pdf-text',
    llmUsed: 'gemini',
  };
}

function generateFallbackNote(testName: string, status: ClassificationStatus): string {
  switch (status) {
    case 'Good': return `Your ${testName} is within the normal range. No action needed.`;
    case 'Needs Attention': return `Your ${testName} is slightly outside normal range. Please monitor with your doctor.`;
    case 'Critical': return `Your ${testName} is at a critical level. Seek medical attention immediately.`;
    default: return `Reference range for ${testName} could not be determined automatically.`;
  }
}

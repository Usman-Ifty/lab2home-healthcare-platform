/**
 * RAG Lookup Utility
 *
 * Matches extracted test names against the medical reference database
 * and classifies patient values as Good / Needs Attention / Critical.
 */

import medicalReferenceDB, { MedicalTest, ReferenceRange } from '../data/medicalReferenceDB';

/** Normalized match result returned by findReferenceRange */
export interface MatchedRange {
  testName: string;
  min: number;
  max: number;
  unit: string;
  criticalLow?: number;
  criticalHigh?: number;
  description: string;
  qualitative?: boolean;
  normalMin?: number;
  normalMax?: number;
  positiveStatus?: 'Good' | 'Needs Attention' | 'Critical';
  negativeStatus?: 'Good' | 'Needs Attention' | 'Critical';
}

/** Classification result */
export type ClassificationStatus = 'Good' | 'Needs Attention' | 'Critical' | 'Unknown';

/**
 * Normalize a string for fuzzy matching: lowercase, strip non-alphanumeric.
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Find the best-matching reference range for a given test name,
 * filtered by patient age and sex.
 *
 * Matching strategy:
 *  1. Exact normalized match on name
 *  2. Exact normalized match on any alias
 *  3. Partial match (input contains alias or alias contains input)
 *
 * Range selection: prefer sex-specific over 'any', then most specific age band.
 */
export function findReferenceRange(
  testName: string,
  patientAge: number,
  patientSex: string
): MatchedRange | null {
  const normalizedInput = normalize(testName);
  if (!normalizedInput) return null;

  // Determine canonical sex
  const sex = patientSex?.toLowerCase() === 'male' ? 'male'
            : patientSex?.toLowerCase() === 'female' ? 'female'
            : 'any';

  let matchedTest: MedicalTest | null = null;

  // Phase 1: Exact name match
  for (const test of medicalReferenceDB) {
    if (normalize(test.name) === normalizedInput) {
      matchedTest = test;
      break;
    }
  }

  // Phase 2: Exact alias match
  if (!matchedTest) {
    for (const test of medicalReferenceDB) {
      for (const alias of test.aliases) {
        if (normalize(alias) === normalizedInput) {
          matchedTest = test;
          break;
        }
      }
      if (matchedTest) break;
    }
  }

  // Phase 3: Partial match (input contains alias or alias contains input)
  if (!matchedTest) {
    for (const test of medicalReferenceDB) {
      const normalizedName = normalize(test.name);
      if (normalizedInput.includes(normalizedName) || normalizedName.includes(normalizedInput)) {
        matchedTest = test;
        break;
      }
      for (const alias of test.aliases) {
        const normalizedAlias = normalize(alias);
        if (normalizedInput.includes(normalizedAlias) || normalizedAlias.includes(normalizedInput)) {
          matchedTest = test;
          break;
        }
      }
      if (matchedTest) break;
    }
  }

  if (!matchedTest) return null;

  // Find the best-matching range for this patient
  const range = selectBestRange(matchedTest.ranges, patientAge, sex);
  
  return {
    testName: matchedTest.name,
    min: range ? range.min : 0,
    max: range ? range.max : 0,
    unit: range ? range.unit : '',
    criticalLow: matchedTest.criticalLow,
    criticalHigh: matchedTest.criticalHigh,
    description: matchedTest.content,
    qualitative: matchedTest.qualitative,
    normalMin: range ? range.min : undefined,
    normalMax: range ? range.max : undefined,
    positiveStatus: matchedTest.positiveStatus,
    negativeStatus: matchedTest.negativeStatus
  };
}

/**
 * Select the most specific range matching patient age and sex.
 * Priority: sex-specific > 'any', tightest age band first.
 */
function selectBestRange(
  ranges: ReferenceRange[],
  age: number,
  sex: string
): ReferenceRange | null {
  if (!ranges || ranges.length === 0) return null;
  // Filter ranges that cover the patient's age
  const ageMatches = ranges.filter(r => age >= r.minAge && age <= r.maxAge);
  if (ageMatches.length === 0) return null;

  // Prefer sex-specific match
  const sexSpecific = ageMatches.filter(r => r.sex === sex);
  if (sexSpecific.length > 0) {
    // Return the tightest age band (smallest span)
    return sexSpecific.sort((a, b) => (a.maxAge - a.minAge) - (b.maxAge - b.minAge))[0];
  }

  // Fallback to 'any' sex
  const anyMatch = ageMatches.filter(r => r.sex === 'any');
  if (anyMatch.length > 0) {
    return anyMatch.sort((a, b) => (a.maxAge - a.minAge) - (b.maxAge - b.minAge))[0];
  }

  // Last resort — return first age match
  return ageMatches[0];
}

/**
 * Classify a numeric value against a reference range.
 */
export function classifyValue(value: any, rangeObject: any): ClassificationStatus {
  // No range found in DB at all
  if (!rangeObject) return "Unknown";

  // Handle qualitative tests (Positive/Negative/Reactive etc.)
  if (rangeObject.qualitative) {
    const v = String(value).toLowerCase().trim();

    const isPositive =
      v.includes('positive') ||
      v === 'reactive'       ||
      v === 'detected'       ||
      v === 'present'        ||
      v === 'yes';

    const isNegative =
      v.includes('negative')     ||
      v === 'non-reactive'       ||
      v === 'not detected'       ||
      v === 'absent'             ||
      v === 'no'                 ||
      v === 'nil';

    if (isPositive) return rangeObject.positiveStatus || "Needs Attention";
    if (isNegative) return rangeObject.negativeStatus || "Good";
    return "Unknown";
  }

  // Handle numeric tests
  const num = parseFloat(value);
  if (isNaN(num)) return "Unknown";

  if (rangeObject.criticalLow !== undefined && num < rangeObject.criticalLow)
    return "Critical";
  if (rangeObject.criticalHigh !== undefined && num > rangeObject.criticalHigh)
    return "Critical";
  if (rangeObject.normalMin !== undefined && num < rangeObject.normalMin)
    return "Needs Attention";
  if (rangeObject.normalMax !== undefined && num > rangeObject.normalMax)
    return "Needs Attention";

  return "Good";
}

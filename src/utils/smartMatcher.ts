/**
 * Smart Input Matcher for Speech and Typing
 * Supports Levenshtein distance, typo tolerance, punctuation stripping,
 * and fuzzy phonetic matching for speech recognition across languages.
 */

// Calculate Levenshtein edit distance between two strings
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];

  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

// Calculate similarity ratio between 0 (no match) and 1 (exact match)
export function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longerLength - distance) / longerLength;
}

// Normalize text for comparison: lowercase, remove punctuation, diacritics, extra spaces
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // Remove Arabic diacritics (Harakat)
    .replace(/[\u064B-\u0652\u0670]/g, '')
    // Normalize Arabic letters: أ/إ/آ -> ا, ة -> ه, ى -> ي
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    // Remove all punctuation (Latin and Arabic)
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،«»"'/\\?<>!]/g, ' ')
    // Collapse multi-spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export interface TextMatchResult {
  isMatch: boolean;
  similarity: number;
  typoCount: number;
  hasTypo: boolean;
  correctedText: string;
  feedbackMessage?: string;
}

/**
 * Checks typed input against target word/phrase with progressive typo tolerance:
 * - 1-3 chars: 0 typos allowed (exact match only)
 * - 4-5 chars: 1 typo allowed (e.g., 'helo' -> 'hello')
 * - 6+ chars: up to 2 typos allowed (similarity >= 0.80)
 */
export function matchText(input: string, target: string): TextMatchResult {
  const cleanInput = normalizeText(input);
  const cleanTarget = normalizeText(target);

  if (!cleanInput || !cleanTarget) {
    return {
      isMatch: false,
      similarity: 0,
      typoCount: 99,
      hasTypo: false,
      correctedText: target
    };
  }

  // 1. Exact match
  if (cleanInput === cleanTarget) {
    return {
      isMatch: true,
      similarity: 1.0,
      typoCount: 0,
      hasTypo: false,
      correctedText: target
    };
  }

  const distance = levenshteinDistance(cleanInput, cleanTarget);
  const similarity = calculateSimilarity(cleanInput, cleanTarget);
  const targetLen = cleanTarget.length;

  let isMatch = false;

  if (targetLen <= 3) {
    // Strict for very short words
    isMatch = distance === 0;
  } else if (targetLen <= 5) {
    // 1 typo allowed for 4-5 letter words
    isMatch = distance <= 1;
  } else {
    // Up to 2 typos or >= 80% similarity for longer words
    isMatch = distance <= 2 || similarity >= 0.80;
  }

  return {
    isMatch,
    similarity,
    typoCount: distance,
    hasTypo: isMatch && distance > 0,
    correctedText: target,
    feedbackMessage: isMatch && distance > 0 ? `تصحيح: ${target}` : undefined
  };
}

export interface SpeechMatchResult {
  isMatch: boolean;
  similarity: number;
  matchedWords: string[];
  missingWords: string[];
  heardText: string;
  expectedText: string;
  feedbackMessage: string;
  confidenceScore: number;
}

/**
 * Checks spoken speech transcript against target phrase:
 * - Uses token boundary checks (avoids false-positive substring collisions)
 * - Tolerates minor acoustic variations while strictly rejecting incorrect words
 * - Provides explicit feedback explaining what was heard vs expected
 */
export function matchSpeech(transcript: string, targetPhrase: string, threshold = 0.75): SpeechMatchResult {
  const cleanTranscript = normalizeText(transcript);
  const cleanTarget = normalizeText(targetPhrase);

  if (!cleanTranscript || !cleanTarget) {
    return {
      isMatch: false,
      similarity: 0,
      matchedWords: [],
      missingWords: cleanTarget ? cleanTarget.split(' ') : [],
      heardText: cleanTranscript,
      expectedText: cleanTarget,
      feedbackMessage: 'لم يتم رصد صوت واضح، تحدث بالميكروفون',
      confidenceScore: 0
    };
  }

  const targetWords = cleanTarget.split(' ').filter(w => w.length > 0);
  const spokenWords = cleanTranscript.split(' ').filter(w => w.length > 0);

  // 1. Direct exact match
  if (cleanTranscript === cleanTarget) {
    return {
      isMatch: true,
      similarity: 1.0,
      matchedWords: targetWords,
      missingWords: [],
      heardText: cleanTranscript,
      expectedText: cleanTarget,
      feedbackMessage: `نطق ممتاز! 🎯 (${targetPhrase})`,
      confidenceScore: 1.0
    };
  }

  // 2. Exact word sequence containment (e.g. user said "um hello there" for "hello")
  const targetJoined = targetWords.join(' ');
  const spokenJoined = spokenWords.join(' ');
  const isPhraseContained = new RegExp(`\\b${targetJoined.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(spokenJoined);

  if (isPhraseContained) {
    return {
      isMatch: true,
      similarity: 1.0,
      matchedWords: targetWords,
      missingWords: [],
      heardText: cleanTranscript,
      expectedText: cleanTarget,
      feedbackMessage: `نطق صحيح ومتقن! ✅ (${targetPhrase})`,
      confidenceScore: 1.0
    };
  }

  // 3. Overall Levenshtein similarity of full normalized string
  const fullSimilarity = calculateSimilarity(cleanTranscript, cleanTarget);
  if (fullSimilarity >= threshold) {
    return {
      isMatch: true,
      similarity: fullSimilarity,
      matchedWords: targetWords,
      missingWords: [],
      heardText: cleanTranscript,
      expectedText: cleanTarget,
      feedbackMessage: `نطق قريب جداً وممتاز! 🎯`,
      confidenceScore: fullSimilarity
    };
  }

  // 4. Word-level matching for multi-word phrases
  const matchedWords: string[] = [];
  const missingWords: string[] = [];

  for (const targetWord of targetWords) {
    const wordFound = spokenWords.some(spokenWord => {
      if (targetWord.length <= 3) {
        return spokenWord === targetWord;
      }
      return calculateSimilarity(spokenWord, targetWord) >= 0.80;
    });

    if (wordFound) {
      matchedWords.push(targetWord);
    } else {
      missingWords.push(targetWord);
    }
  }

  const wordRatio = targetWords.length > 0 ? matchedWords.length / targetWords.length : 0;
  const bestScore = Math.max(fullSimilarity, wordRatio);
  const isMatch = bestScore >= threshold;

  const feedbackMessage = isMatch
    ? `أحسنت! نطق صحيح 🎯 (${targetPhrase})`
    : `❌ سمعت: "${cleanTranscript}" | المطلوب: "${targetPhrase}"`;

  return {
    isMatch,
    similarity: bestScore,
    matchedWords,
    missingWords,
    heardText: cleanTranscript,
    expectedText: cleanTarget,
    feedbackMessage,
    confidenceScore: bestScore
  };
}

import { getApiKey } from '../utils/apiKeyPool';
import { TEXT_MODEL } from '../constants';
import { useReviewStore, ReviewCard } from '../store/reviewStore';
import { initialSRS } from '../../utils/srs';

export interface ExtractedLearningItem {
    nativeText: string;
    targetText: string;
    pronunciation?: string;
    type: 'NATIVE_SUBSTITUTION' | 'MISTAKE' | 'VOCABULARY' | 'USEFUL_EXPRESSION' | 'MISUNDERSTOOD';
    context?: string;
    explanation?: string;
}

export interface SessionExtractionResult {
    summary: string;
    extractedCount: number;
    items: ExtractedLearningItem[];
}

const EXTRACTION_SYSTEM = `You are an expert AI Language Memory Analyzer.
Your task is to analyze a completed conversation between a language learner and an AI tutor.
Silently extract meaningful learning opportunities for spaced repetition memory cards.

Rules for extraction:
1. Extract 1 to 4 high-value learning items from what ACTUALLY happened in the conversation.
2. Categories:
   - NATIVE_SUBSTITUTION: The learner used their native language because they didn't know the target word.
   - MISTAKE: Meaningful grammar or phrasing error that was corrected.
   - VOCABULARY: Core new target language words introduced and practiced.
   - USEFUL_EXPRESSION: Key natural phrases.
   - MISUNDERSTOOD: Phrases the learner struggled to understand.
3. DO NOT extract obvious trivialities. Only extract items the learner genuinely needs to practice.
4. Output STRICT JSON format only. No markdown fences or extra text.

JSON Schema:
{
  "summary": "ملخص مشجع للمحادثة في سطر أو سطرين بالعربية",
  "items": [
    {
      "nativeText": "المعنى بالعربية",
      "targetText": "The word/phrase in target language",
      "pronunciation": "النطق التقريبي بالأحرف العربية",
      "type": "NATIVE_SUBSTITUTION",
      "context": "الجملة التي وردت فيها",
      "explanation": "ملاحظة تصحيح أو استخدام قصيرة جداً"
    }
  ]
}`;

export async function extractSessionLearningItems(
    transcript: { speaker: string; text: string }[],
    options: {
        targetLanguage?: string;
        nativeLanguage?: string;
        level?: string;
    }
): Promise<SessionExtractionResult | null> {
    // Need at least 2 exchanges to be meaningful
    if (!transcript || transcript.length < 2) {
        return null;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('[sessionExtractor] No API key available for extraction');
        return null;
    }

    const transcriptText = transcript
        .map(t => `${t.speaker === 'bot' ? 'Tutor' : 'Learner'}: ${t.text}`)
        .join('\n');

    const prompt = `Target Language: ${options.targetLanguage || 'English'}
Learner Native Language: ${options.nativeLanguage || 'Arabic'}
CEFR Level: ${options.level || 'A1'}

Conversation Transcript:
${transcriptText}

Extract the learning items and summary now in strict JSON.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM }] },
                    generationConfig: {
                        temperature: 0.2,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        );

        if (!response.ok) {
            console.warn('[sessionExtractor] API call failed:', response.status);
            return null;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!rawText) return null;

        const parsed = JSON.parse(rawText) as {
            summary?: string;
            items?: ExtractedLearningItem[];
        };

        const items = parsed.items || [];
        const summary = parsed.summary || 'محادثة رائعة! تم حفظ الكلمات الجديدة في صندوق المراجعة.';

        // Save unique items directly to ReviewStore
        if (items.length > 0) {
            const now = Date.now();
            const newCards: ReviewCard[] = items.map((item, idx) => ({
                id: `extracted_${now}_${idx}`,
                native: item.nativeText,
                translation: item.targetText,
                pronunciation: item.pronunciation,
                tier: item.type === 'MISTAKE' || item.type === 'NATIVE_SUBSTITUTION' ? 'core' : 'medium',
                addedAt: now,
                nextReviewAt: now, // Due immediately for first reinforcement
                intervalMinutes: 10,
            }));

            useReviewStore.getState().addCards(newCards);
            console.log(`[sessionExtractor] Saved ${newCards.length} learning cards to review store`);
        }

        return {
            summary,
            extractedCount: items.length,
            items,
        };
    } catch (err) {
        console.error('[sessionExtractor] Error during background extraction:', err);
        return null;
    }
}

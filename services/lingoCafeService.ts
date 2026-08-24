
import { generateContentWithRetry } from './ai';
import { Type } from '@google/genai';
import { Language, Topic } from '../types';
import { cleanAndParseJson } from '../utils/json';
import { TEXT_MODEL } from '../constants';

// Types specific to LingoCafe
export interface CafeTopic {
    title: string;
    dialogue: {
        speaker: 'A' | 'B';
        text: string;
        translation: string;
    }[];
}

export interface CafeTranslationResult {
    detectedLanguage: string;
    correctedOriginal: string;
    translation: string;
    transliteration: string;
}

export const generateCafeTopic = async (
    lessonTopic: Topic,
    targetLanguage: Language,
    nativeLanguage: Language
): Promise<CafeTopic> => {
    try {
        const prompt = `
        Generate a short, fun, and balanced **Dialogue Script** between two friends (Speaker A and Speaker B) chatting at a coffee shop about: "${lessonTopic.title}".
        
        Target Language: ${targetLanguage.englishName}.
        Native Language (for context/translation): ${nativeLanguage.englishName}.

        **MANDATORY FORMAT RULES:**
        1.  **Dialogue Structure:** The output MUST be a conversation with alternating turns (A -> B -> A -> B). Do NOT produce a single block of text or a monologue.
        2.  **Balanced:** Both speakers should talk roughly the same amount (4-6 turns total).
        3.  **Content:** Fun, casual, daily life conversation suitable for a cafe setting.

        Output JSON Schema:
        {
            "title": "A cozy, catchy title in ${nativeLanguage.englishName}",
            "dialogue": [
                { "speaker": "A", "text": "Greeting or Question in ${targetLanguage.englishName}", "translation": "Meaning in ${nativeLanguage.englishName}" },
                { "speaker": "B", "text": "Reply in ${targetLanguage.englishName}", "translation": "Meaning in ${nativeLanguage.englishName}" },
                { "speaker": "A", "text": "Follow-up...", "translation": "..." },
                { "speaker": "B", "text": "Response...", "translation": "..." }
            ]
        }
        `;

        const response = await generateContentWithRetry({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        dialogue: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    speaker: { type: Type.STRING, enum: ["A", "B"] },
                                    text: { type: Type.STRING },
                                    translation: { type: Type.STRING }
                                },
                                required: ["speaker", "text", "translation"]
                            }
                        }
                    },
                    required: ["title", "dialogue"]
                }
            }
        });

        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Cafe Topic Error", error);
        return {
            title: "قهوة الصباح",
            dialogue: [
                { speaker: "A", text: `Let's talk about ${lessonTopic.title}.`, translation: "لنتحدث عن الموضوع." },
                { speaker: "B", text: "That sounds great!", translation: "هذا يبدو رائعاً!" }
            ]
        };
    }
};

export const processCafeInput = async (
    input: string,
    targetLanguage: Language,
    nativeLanguage: Language
): Promise<CafeTranslationResult> => {
    try {
        const prompt = `
        Translate the input from ${nativeLanguage.englishName} to ${targetLanguage.englishName}.
        Input: "${input}"
        
        Rules:
        1. Correct any errors in input.
        2. Provide the ${targetLanguage.englishName} translation.
        3. Provide pronunciation (Transliteration) for the translation.

        Output JSON:
        {
            "detectedLanguage": "${nativeLanguage.code}",
            "correctedOriginal": "corrected input",
            "translation": "target translation",
            "transliteration": "pronunciation"
        }
        `;

        const response = await generateContentWithRetry({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        detectedLanguage: { type: Type.STRING },
                        correctedOriginal: { type: Type.STRING },
                        translation: { type: Type.STRING },
                        transliteration: { type: Type.STRING }
                    }
                },
                            }
        });

        return cleanAndParseJson(response.text);
    } catch (error) {
        console.error("Cafe Process Error", error);
        throw error;
    }
};

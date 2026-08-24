
import { generateContentWithRetry } from './ai';
import { Type } from '@google/genai';
import { Language, Topic } from '../types';
import { cleanAndParseJson } from '../utils/json';
import { TEXT_MODEL } from '../constants';

export interface SnowballTurnResult {
    newFullSentence: string;
    newFullSentenceScript?: string; // NEW: Native script for TTS
    addedPart: string;
    translation: string;
}

export const generateSnowballContinuation = async (
    currentSentence: string,
    topic: Topic,
    targetLanguage: Language,
    nativeLanguage: Language,
    level: string
): Promise<SnowballTurnResult> => {
    try {
        const isZhOrJa = targetLanguage.code === 'zh' || targetLanguage.code === 'ja';
        const scriptInstruction = isZhOrJa ? 
            `4. **SCRIPT**: Provide the native script version of the "newFullSentence" in the "newFullSentenceScript" field. 
               - For Chinese: If "newFullSentence" is Pinyin, provide Hanzi.
               - For Japanese: If "newFullSentence" is Romaji, provide Kanji/Kana.` 
            : "";

        // If it's the very first turn (empty string), ask for a starter word/phrase
        const isStart = !currentSentence || currentSentence.trim() === '';
        
        const prompt = isStart 
            ? `
                Start a "Snowball Sentence Game" about "${topic.title}".
                Target Language: ${targetLanguage.englishName}.
                Level: ${level}.
                
                Task: Provide a simple starting word or short phrase (1-2 words) to begin a story.
                
                ${scriptInstruction}

                Output JSON:
                {
                    "newFullSentence": "The starting word(s)",
                    "newFullSentenceScript": "Native Script (Optional)",
                    "addedPart": "The starting word(s)",
                    "translation": "Arabic translation"
                }
            ` 
            : `
                We are playing the "Snowball Sentence Game" about "${topic.title}".
                The goal is to keep the flow going and build a fun story/sentence.
                
                Current Input from User: "${currentSentence}"
                Target Language: ${targetLanguage.englishName}.
                
                Task:
                1. Accept the "Current Input" as the base (even if it changed slightly from previous turns).
                2. Add 1-3 new words to the end to continue the logic/story naturally.
                3. Keep it simple and rhythmical if possible.
                ${scriptInstruction}
                
                Output JSON:
                {
                    "newFullSentence": "The User Input + Your New Words",
                    "newFullSentenceScript": "Native Script (Optional)",
                    "addedPart": "Only the new words you added",
                    "translation": "Arabic translation of the NEW full sentence"
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
                        newFullSentence: { type: Type.STRING },
                        newFullSentenceScript: { type: Type.STRING },
                        addedPart: { type: Type.STRING },
                        translation: { type: Type.STRING }
                    },
                    required: ["newFullSentence", "addedPart", "translation"]
                },

            }
        });

        return cleanAndParseJson(response.text);

    } catch (error) {
        console.error("Snowball AI Error", error);
        return {
            newFullSentence: currentSentence + " ...",
            addedPart: "...",
            translation: "حدث خطأ في الاتصال"
        };
    }
};

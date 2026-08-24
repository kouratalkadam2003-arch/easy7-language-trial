
import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse, GenerateImagesParameters, GenerateImagesResponse, Type, Modality } from '@google/genai';
import { Language, WordData, ImageGenerationItem, AssistantContextData, AssistantMessage, LessonExportData, SubstitutionVariation } from '../types';
import { cleanAndParseJson } from '../utils/json';
import { TEACHER_PERSONAS, FIXED_CHARACTERS, TTS_CONVERSION_PROMPT, TEXT_MODEL, TTS_MODEL } from '../constants';
import { getApiKey, markKeyExhausted } from '../src/utils/apiKeyPool';

export { getApiKey };
export const getAiClient = () => new GoogleGenAI({ apiKey: getApiKey() });
export const ai = new GoogleGenAI({ apiKey: getApiKey() });

// Simple in-memory cache for speech to avoid re-generating the same audio
const speechCache = new Map<string, string>();
const voiceAnalysisCache = new Map<string, 'male' | 'female'>();

export const getErrorMessage = (e: any): string => {
    if (typeof e === 'string') return e;
    if (e?.message) return e.message;
    if (e?.error?.message) return e.error.message;
    try {
        return JSON.stringify(e);
    } catch {
        return 'An unknown error occurred';
    }
};

const generateWithRetry = async <P, R>(
  apiCall: (params: P) => Promise<R>,
  params: P,
  maxRetries = 3,
  initialDelay = 1000,
  timeoutMs = 60000
): Promise<R> => {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await Promise.race([
          apiCall(params),
          new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
          )
      ]);
      return response as R;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
      const isServerError = errorMessage.includes('500') || errorMessage.includes('INTERNAL');
      const isHardQuotaError = errorMessage.includes('plan and billing') || errorMessage.includes('limit: 0');
      const isTimeout = errorMessage.includes('timed out');

      // Do NOT retry if it's a hard quota limit or billing issue
      if (isHardQuotaError) {
          console.error("Hard Quota Limit Reached. Stopping retries.");
          throw new Error("Quota exceeded. Please try again later or check billing.");
      }

      if ((isRateLimitError || isServerError || isTimeout) && attempt < maxRetries - 1) {
        attempt++;
        const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`API Error (${isServerError ? 'Server' : (isTimeout ? 'Timeout' : 'Rate Limit')}). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(errorMessage);
      }
    }
  }
  throw new Error('Max retries reached for API call');
};

export const generateContentWithRetry = async (
  params: GenerateContentParameters,
  maxRetries = 3
): Promise<GenerateContentResponse> => {
    // FIX: Wrap in arrow function to preserve 'this' context for the SDK
    return generateWithRetry((p) => ai.models.generateContent(p), params, maxRetries, 1000);
};

export const generateImagesWithRetry = async (
  params: GenerateImagesParameters,
  maxRetries = 2
): Promise<GenerateImagesResponse> => {
    // FIX: Wrap in arrow function to preserve 'this' context for the SDK
    return generateWithRetry((p) => ai.models.generateImages(p), params, maxRetries, 500, 30000); 
};


interface FetchTranslationParams {
    text: string;
    wordDataCache: Record<string, WordData>;
    language: Language;
    nativeLanguage: Language; 
    onCacheWordData: (key: string, data: WordData) => void;
}

interface FetchTranslationResult {
    translation: string | null;
    nativeText: string | null;
}

export const fetchContextualTranslation = async ({
    text,
    wordDataCache,
    language,
    nativeLanguage,
    onCacheWordData,
}: FetchTranslationParams): Promise<FetchTranslationResult> => {
    const trimmedText = text?.trim();
    if (!trimmedText) {
        return { translation: null, nativeText: null };
    }

    const key = `${nativeLanguage.code}:${trimmedText.toLowerCase()}`;
    if (wordDataCache[key]?.translation) {
        return { translation: wordDataCache[key].translation, nativeText: wordDataCache[key]?.native || null };
    }
    
    if (!trimmedText.includes(' ')) {
        const cleanKey = `${nativeLanguage.code}:${key.replace(/^[.,!?;:"]+|[.,!?;:"]+$/g, '')}`;
        if (wordDataCache[cleanKey]?.translation) {
            return { translation: wordDataCache[cleanKey].translation, nativeText: wordDataCache[cleanKey]?.native || null };
        }
    }

    try {
        if (language.code === 'ja' || language.code === 'zh') {
            const scriptType = language.code === 'ja' ? 'Japanese (with Kanji/Kana)' : 'Chinese (with Hanzi characters)';
            const inputType = language.code === 'ja' ? 'Romaji' : 'Pinyin';
            const systemInstruction = `You are a language expert. Provide a direct, contextual translation to ${nativeLanguage.englishName} and the native script for the given text. Do NOT use any colloquial dialects. Your entire output must be a single JSON object.`;
            
            const response = await generateContentWithRetry({
                model: TEXT_MODEL,
                contents: `Translate the following ${language.englishName} text ("${trimmedText}") to ${nativeLanguage.englishName} and provide its native ${scriptType} script. The input text is in ${inputType}. The translation must be contextual, not literal.`,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            translation: { type: Type.STRING, description: `The contextual ${nativeLanguage.englishName} translation of the text.` },
                            nativeScript: { type: Type.STRING, description: `The text converted to its native ${scriptType} script.` }
                        },
                        required: ['translation', 'nativeScript']
                    }
                }
            });
            
            const data = cleanAndParseJson(response.text || "{}");
            if (!data.translation) throw new Error("Invalid data received from API.");
            
            onCacheWordData(key, { translation: data.translation, native: data.nativeScript });
            return { translation: data.translation, nativeText: data.nativeScript };

        } else {
            const response = await generateContentWithRetry({
                model: TEXT_MODEL,
                contents: `Translate the following ${language.englishName} text to ${nativeLanguage.englishName} based on its context:\n\n"${trimmedText}"`,
                config: {
                    systemInstruction: `You are an expert translator. Your task is to provide a direct, contextual, and natural-sounding translation in ${nativeLanguage.englishName}. Do NOT use any colloquial dialects. Respond ONLY with the translated text and nothing else. The output language must be ${nativeLanguage.englishName}.`,

                }
            });
            const newTranslation = response.text ? response.text.trim() : null;
            if (!newTranslation) throw new Error("Empty translation received.");
            onCacheWordData(key, { translation: newTranslation });
            return { translation: newTranslation, nativeText: null };
        }
    } catch (err) {
        console.error("Translation error:", err);
        const errorMessage = getErrorMessage(err);
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            return { translation: "Quota exceeded (Translation)", nativeText: null };
        }
        return { translation: "Translation failed. Try again.", nativeText: null };
    }
};

interface FetchArabicTranslationParams {
    text: string;
    targetLanguage: Language;
}

export const fetchArabicTranslation = async ({ text, targetLanguage }: FetchArabicTranslationParams): Promise<string | null> => {
    const trimmedText = text?.trim();
    if (!trimmedText) {
        return null;
    }

    try {
        const response = await generateContentWithRetry({
            model: TEXT_MODEL,
            contents: `Translate the following Arabic text to ${targetLanguage.englishName} based on its context:\n\n"${trimmedText}"`,
            config: {
                systemInstruction: `You are an expert translator. Your task is to provide a direct, contextual, and natural-sounding translation into ${targetLanguage.englishName}. Respond ONLY with the translated text.`,

            }
        });
        const translation = response.text ? response.text.trim() : null;
        if (!translation) throw new Error("Empty translation received.");
        return translation;
    } catch (err) {
        console.error(`Arabic to ${targetLanguage.englishName} translation error:`, err);
        const errorMessage = getErrorMessage(err);
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            return "Quota exceeded";
        }
        return "Translation failed. Try again.";
    }
};

// --- NEW: QUICK TRANSLATOR FOR CHAT (Bidirectional + Audio Script) ---
export interface QuickTranslationResult {
    targetText: string;      // The phrase in target language (for display)
    audioScript: string;     // Native script for audio (Hanzi/Kanji)
    meaning: string;         // Arabic Meaning
}

export const quickTranslate = async (
    input: string, 
    targetLanguage: Language
): Promise<QuickTranslationResult | null> => {
    try {
        const prompt = `
        You are a smart translator helper.
        Input: "${input}"
        Target Language: ${targetLanguage.englishName}
        Native Language: Arabic
        
        Logic:
        1. If Input is Arabic -> Translate it to ${targetLanguage.englishName}.
        2. If Input is ${targetLanguage.englishName} (or Pinyin/Romaji) -> Translate it to Arabic.
        
        Output JSON:
        {
            "targetText": "The phrase in ${targetLanguage.englishName} (Display version, e.g. Pinyin/Romaji or Standard)",
            "audioScript": "The native script version for Text-to-Speech (e.g. Hanzi, Kanji). If same as targetText, repeat it.",
            "meaning": "The Arabic translation/meaning"
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
                        targetText: { type: Type.STRING },
                        audioScript: { type: Type.STRING },
                        meaning: { type: Type.STRING }
                    },
                    required: ["targetText", "audioScript", "meaning"]
                },

            }
        });

        return cleanAndParseJson(response.text || "{}");
    } catch (e) {
        console.error("Quick translate failed", e);
        return null;
    }
};

export const getAssistantResponse = async (
    query: string,
    history: AssistantMessage[],
    context: AssistantContextData | null
): Promise<string> => {
    let systemInstruction = `You are a friendly, encouraging, and knowledgeable language learning assistant named 'GuideBot'. The user is learning languages through an interactive app. Your responses must be in Arabic.
    Your personality is supportive and a little bit playful. Use emojis to make your responses more engaging.
    Keep your answers concise and easy to understand for a language learner.`;

    if (context) {
        systemInstruction += `

        **CURRENT LESSON CONTEXT:**
        - **Language being learned:** ${context.language.englishName} (${context.language.name})
        - **User's Native Language:** Arabic
        - **Lesson Day:** ${context.dayNumber}
        - **Topic:** "${context.topic.title}"
        - **Proficiency Level:** ${context.level}
        - **Lesson Story (in Arabic):** "${context.story.translatedText}"
        - **Grammar Tip:** "${context.story.grammarTip.title}: ${context.story.grammarTip.tip}"

        **Your Task:**
        Act as a personal tutor for this specific lesson. Answer the user's questions based *only* on the context provided.
        - If asked to explain something, simplify it.
        - If asked for an example, create a simple new one related to the topic.
        - If asked a question you can't answer from the context, politely say you can only help with the current lesson material.
        - Do not reveal the full story or all vocabulary at once if the user hasn't seen it. Guide them.
        `;
    } else {
        systemInstruction += `
        **Your Task:**
        The user is currently not inside a lesson. You can answer general questions about language learning, how the app works, or encourage them to start a new lesson.
        `;
    }

    const contents = history.map(msg => ({
        role: msg.speaker === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));
    contents.push({ role: 'user', parts: [{ text: query }] });
    
    try {
        const response = await generateContentWithRetry({
            model: TEXT_MODEL, 
            contents,
            config: {
                systemInstruction,
                temperature: 0.8,

            }
        });
        return response.text?.trim() || "لم أستطع توليد إجابة.";
    } catch (error) {
        console.error("Assistant AI error:", error);
        return "عذراً، أواجه بعض الصعوبات التقنية الآن. 🛠️ حاول مرة أخرى بعد قليل!";
    }
};

const YUKI_SENSEI_PROMPT_TEMPLATE = `
// MISSION
You MUST fully embody the persona of "{TEACHER_NAME}," a friendly, encouraging, and helpful 3D Avatar teacher for Arabic speakers learning {TARGET_LANGUAGE_NAME}.

// CRITICAL: SECTION-BASED GUIDANCE
You are creating a real-time companion script that guides the user through EACH STAGE of the app.
You MUST divide your response into sections using the tag \`[SECTION:stage_name]\`.
The supported stages are: \`story\`, \`game\`, \`memory\`, \`chat\`, \`review\`, \`deck\`, \`practice\`. Also add an \`intro\` section.

// SCRIPT FORMAT (ABSOLUTE CRITICAL RULE)
- Your entire output MUST be a single block of text containing all sections.
- Each section starts with \`[SECTION:stage_name]\`.
- Inside each section, each spoken line or pause MUST be on a new line.
- Each line MUST start with ONE of these tags:
  - \`[ARABIC]\` for Arabic text.
  - \`[TARGET]\` for {TARGET_LANGUAGE_NAME} text (normal speed).
  - \`[TARGET_SLOW]\` for {TARGET_LANGUAGE_NAME} text (slow speed).
  - \`[PAUSE]\` for a 3-second pause.
  - \`[ACTION:jump_text]\` (Avatar jumps to the top where text usually is).
  - \`[ACTION:climb_button]\` (Avatar climbs down to where buttons usually are).
  - \`[ACTION:center]\` (Avatar moves to center screen).

// CONTENT GUIDE

[SECTION:intro]
- Welcome the user warmly.
- [ACTION:center]
- Announce the topic: "{TOPIC_TITLE}".
- Tell them to click the "Story" tab to begin.

[SECTION:story]
- Announce "Stage 1: Reading the Story!".
- [ACTION:jump_text]
- Read the full dialogue in {TARGET_LANGUAGE_NAME} clearly. Use \`[TARGET]\`.
- [ACTION:center]
- Give a brief summary in Arabic.
- Tell them to listen carefully and then click "Game" when ready.

[SECTION:game]
- Announce "Stage 2: The Game!".
- [ACTION:climb_button]
- Challenge them to answer the questions correctly.
- Say "Focus! Don't let the wrong answers trick you!" in Arabic.

[SECTION:memory]
- Announce "Stage 3: Memory Drill!".
- [ACTION:center]
- Explain we will do 3 steps: Shadowing, Visualization, and Substitution.
- Say: "Repeat after me with feeling! Close your eyes and imagine!" in Arabic.

[SECTION:chat]
- Announce "Stage 4: Text Chat!".
- [ACTION:jump_text]
- Tell them to read the conversation between the characters.
- Point out one "Additional Expression" they should notice.

[SECTION:review]
- Announce "Stage 5: Review!".
- Encourage them to check the flashcards.

[SECTION:deck]
- Announce "Flashcard Deck!".
- Tell them spaced repetition is the key to memory.

[SECTION:practice]
- Announce "Voice Practice!".
- Encourage them to speak out loud. "Don't be shy!"

// --- LESSON DATA FOR THIS SCRIPT ---

- **Topic:** {TOPIC_TITLE}
- **Full Dialogue:**
{STORY_TEXT}
- **Additional Expressions:**
{ADDITIONAL_EXPRESSIONS}

// --- FINAL INSTRUCTIONS ---
- No JSON, no markdown.
- Adhere strictly to the [SECTION:...] and line-by-line tagging format.
- Make it fun, energetic, and supportive.
`;

export const generateYukiSenseiScript = async (lessonData: LessonExportData): Promise<string> => {
     const formatExpressions = (expressions: LessonExportData['story']['additionalExpressions']) => {
        return expressions?.map(exp => `"${exp.phrase}" which means "${exp.translation}"`).join(', ') || 'No additional expressions.';
    };

    const teacher = TEACHER_PERSONAS[lessonData.language.code] || TEACHER_PERSONAS.ar;

    const prompt = YUKI_SENSEI_PROMPT_TEMPLATE
        .replace(/{TEACHER_NAME}/g, teacher.name)
        .replace(/{TARGET_LANGUAGE_NAME}/g, lessonData.language.englishName)
        .replace(/{TOPIC_TITLE}/g, lessonData.topic.title)
        .replace('{STORY_TEXT}', lessonData.story.originalText)
        .replace('{ADDITIONAL_EXPRESSIONS}', formatExpressions(lessonData.story.additionalExpressions || []));

    try {
        const response = await generateContentWithRetry({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                temperature: 0.9,

            }
        });
        return response.text?.trim() || "";
    } catch (error) {
        console.error("Yuki-Sensei script generation error:", error);
        throw new Error("Failed to generate Yuki-Sensei's script.");
    }
};

export const generateRaceBanter = async (
    userLevel: number,
    opponent1: { name: string, level: number },
    opponent2: { name: string, level: number }
): Promise<{ speaker: string, text: string } | null> => {
    try {
        const response = await generateContentWithRetry({
            model: TEXT_MODEL,
            contents: `
            Scenario: A language learning board game race.
            
            Racers:
            1. User (The Hero): Level ${userLevel}
            2. ${opponent1.name} (The Rival): Level ${opponent1.level}
            3. ${opponent2.name} (The Jester): Level ${opponent2.level}
            
            Task: Generate a ONE-LINE funny banter/insult/joke in ARABIC (colloquial or fun Modern Standard).
            
            Rules:
            - Determine WHO speaks based on the situation (e.g., if Rival is ahead, they mock the User. If User is ahead, Rival makes an excuse).
            - The comment should be competitive but friendly/funny.
            - Examples: "Look at that turtle!", "I'm unstoppable!", "Wait for me!", "Did you cheat?".
            
            Return JSON only: { "speaker": "Name of Speaker", "text": "The Arabic text" }
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        speaker: { type: Type.STRING },
                        text: { type: Type.STRING }
                    }
                },

            }
        });
        
        return cleanAndParseJson(response.text || "{}");
    } catch (e) {
        console.error("Banter generation failed", e);
        return null;
    }
};

export const cleanTextFromScriptLabels = (text: string): string => {
    if (!text) return "";
    
    // 1. Remove Markdown formatting characters (*, _, ~, `) FIRST. 
    // This ensures "**Alice:**" becomes "Alice:" before the next regex runs.
    let cleaned = text.replace(/[\*_~`]/g, '');
    
    // 2. Remove Speaker Names / Labels
    // Pattern: Start of line -> optional space -> Name (letters, numbers, localized chars) -> Colon -> space
    // Added support for Full-width colon (：) used in Asian scripts
    // Increased max length slightly to 30 to catch longer names "Mr. James:"
    const speakerRegex = /^[ \t]*[\w\u00C0-\u00FF\u0600-\u06FF\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\d \.\-]{1,30}[:：]\s*/gm;
    cleaned = cleaned.replace(speakerRegex, '');
    
    // 3. Remove numbered lists (e.g., "1. ")
    cleaned = cleaned.replace(/^[ \t]*\d+\.\s*/gm, '');
    
    // 4. Remove parentheticals (actions/context) like "(laughs)" or "（笑）"
    cleaned = cleaned.replace(/\(.*?\)|（.*?）/g, ''); 
    
    // 5. Remove Emojis
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    
    return cleaned.trim();
};

export const analyzeTextVoiceAttributes = async (text: string, languageCode: Language['code'] | 'ar'): Promise<'male' | 'female'> => {
    if (voiceAnalysisCache.has(text)) {
        return voiceAnalysisCache.get(text)!;
    }

    try {
        const response = await generateContentWithRetry({
            model: TEXT_MODEL,
            contents: `Gender? "male" or "female". Text: "${text.substring(0, 50)}..."`,
            config: {
                temperature: 0,
            }
        });
        
        const result = response.text?.trim().toLowerCase();
        const gender = (result?.includes('female')) ? 'female' : 'male';
        
        voiceAnalysisCache.set(text, gender);
        return gender;
    } catch (e) {
        console.warn("Voice analysis failed, defaulting to male.", e);
        return 'male';
    }
};

export const generateSpeechFromText = async (text: string, languageCode: Language['code'] | 'ar', speed: number = 1.0, voiceName?: string): Promise<string> => {
    // 1. Clean the text thoroughly so speaker names aren't read
    const cleanedText = cleanTextFromScriptLabels(text);
    if (!cleanedText) {
        console.warn("Text is empty after cleaning, returning dummy audio state.");
        return ""; // Cannot throw or it triggers the quota error logic unnecessarily
    }

    // 2. Determine Voice
    let effectiveVoice = voiceName;
    if (!effectiveVoice) {
        const fixedChars = FIXED_CHARACTERS[languageCode];
        if (fixedChars) {
            effectiveVoice = (TEACHER_PERSONAS[languageCode] || TEACHER_PERSONAS.ar).voiceName;
        } else {
             effectiveVoice = (TEACHER_PERSONAS[languageCode] || TEACHER_PERSONAS.ar).voiceName;
        }
    }

    // 3. Cache Key (Includes Speed)
    const cacheKey = `${languageCode}:${speed}:${effectiveVoice}:${cleanedText}`;
    if (speechCache.has(cacheKey)) {
        return speechCache.get(cacheKey)!;
    }

    try {
        // 4. Use the raw cleaned text directly to prevent AudioOut model from returning conversational/non-audio text responses.
        const finalPromptText = cleanedText;

        const response = await generateContentWithRetry({
            model: TTS_MODEL,
            contents: [{ parts: [{ text: finalPromptText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: effectiveVoice },
                    },
                },
            },
        });
        
        // Safety check for response structure
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from TTS API.");
        }
        
        speechCache.set(cacheKey, base64Audio);
        return base64Audio;
    } catch (error) {
        console.error("AI Speech Generation Error:", error);
        throw new Error(`Failed to generate speech: ${getErrorMessage(error)}`);
    }
};

// --- NEW FUNCTION: CONVERT TEXT FOR TTS (Strict Pinyin/Romaji -> Native) ---
// This calls the AI to perform the "mental conversion" explicitly if we need the text string itself (e.g. for history)
export const convertTextForTTS = async (text: string, languageCode: string): Promise<{ display_text: string, tts_text: string, locale: string } | null> => {
    try {
        const response = await generateContentWithRetry({
            model: TEXT_MODEL,
            contents: `Input Text: "${text}"\nTarget Language Code: ${languageCode}`,
            config: {
                systemInstruction: TTS_CONVERSION_PROMPT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        display_text: { type: Type.STRING },
                        tts_text: { type: Type.STRING }, // Renamed from original_text to match prompt
                        locale: { type: Type.STRING }
                    },
                    required: ["display_text", "tts_text", "locale"]
                },

            }
        });
        return cleanAndParseJson(response.text || "{}");
    } catch (e) {
        console.warn("TTS Text Conversion Failed:", e);
        return null;
    }
};

export const generateNewSubstitution = async (
    originalSentence: string,
    contextWord: string,
    targetLanguage: Language,
    nativeLanguage: Language
): Promise<SubstitutionVariation> => {
    try {
        const response = await generateContentWithRetry({
            model: TEXT_MODEL,
            contents: `
                You are a language teacher.
                Base Sentence: "${originalSentence}"
                Current Variable: "${contextWord}"
                
                Task: Create a NEW variation by replacing "${contextWord}" with a different word of the **SAME CATEGORY** (e.g., Name -> Name, City -> City, Food -> Food).
                
                CRITICAL RULES:
                1. **PRESERVE THE SENTENCE FRAME:** Do not change any other words in the sentence. The structure, grammar, and other vocabulary must remain *identical* to the Base Sentence.
                2. **CONTEXT:** The new word must make sense in this context.
                3. **TARGET:** The sentence must be in ${targetLanguage.englishName}.
                4. **TRANSLATION:** Provide the Arabic translation.
                
                Respond ONLY with this JSON structure:
                {
                    "changedWord": "the new word inserted",
                    "fullSentence": "the complete new sentence",
                    "translation": "translated sentence"
                }
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        changedWord: { type: Type.STRING },
                        fullSentence: { type: Type.STRING },
                        translation: { type: Type.STRING }
                    },
                    required: ['changedWord', 'fullSentence', 'translation']
                },

            }
        });
        
        return cleanAndParseJson(response.text || "{}");
    } catch (error) {
        console.error("Failed to regenerate substitution:", error);
        throw error;
    }
};

export const sendTextChatMessage = async (
    history: { speaker: string; text: string }[],
    newMessage: string,
    language: Language,
    nativeLanguage: Language,
    level: string
) => {
    try {
        const historyText = history.map(msg => `${msg.speaker === 'A' ? 'Eli' : 'Laith'}: ${msg.text}`).join('\n');
        
        const response = await generateContentWithRetry({
            model: TEXT_MODEL,
            contents: `
                You are Eli (إيلي), a patient, warm, and highly dedicated 20-year-old local girl who lives in the village. You are talking to Laith (ليث) (the user), a traveler learning your language.
                Target Language: ${language.englishName}.
                User's Native Language: ${nativeLanguage.englishName} (Arabic).
                User Level: ${level}.
                
                CRITICAL IMMERSION AND SAFETY RULES:
                1. **STRICT PERSONA BOUNDARIES (JAILBREAK PROTECTION):**
                   - You MUST never admit to being an AI, computer program, or language model. If asked "Who are you?", explain your persona as Eli, a local villager.
                   - You are strictly forbidden from discussing politics, philosophy, coding, math, general world facts, or any subject unrelated to language practice and daily village life.
                   - **OFF-TOPIC GUARDRAIL:** If the user asks an off-topic question or attempts to bypass boundaries (e.g., "write Python code", "tell me about history"), you MUST politely decline in character, keeping the learner immersed in the story. (Example: "دعنا نركز على ممارسة اللغة والحديث عن القرية يا ليث!" or "We should stick to our language practice, Laith!").
                2. **LANGUAGE LEVEL ADAPTABILITY:**
                   - Speak strictly at ${level} level. Use simple, short sentences (1-2 sentences max).
                   - The response "text" field MUST be in ${language.englishName}.
                   - If the user makes grammatical or vocabulary mistakes in their message, softly correct them in ${nativeLanguage.englishName} inside the "translation" or "text" (clearly marked as a helpful hint), then continue the conversation naturally in the target language.
                3. **STORY AND SCENARIO COHESION:**
                   - Remain fully immersed in the fantasy/historical village theme of the game. Refer to daily village chores, your small plot, the goat, or collecting firewood.
                
                Chat History:
                ${historyText}
                Laith: ${newMessage}
                
                Task: Write Eli's next reply. Keep it encouraging, short, and ask a simple relevant question about the day or the lesson topic.
                
                Respond ONLY with this JSON structure:
                {
                    "text": "The response in the target language (${language.englishName})",
                    "pronunciation": "Pronunciation/Romanization of the text",
                    "translation": "Translation of your response in the user's native language (${nativeLanguage.englishName}) along with any polite, soft correction if Laith made a mistake"
                }
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        pronunciation: { type: Type.STRING },
                        translation: { type: Type.STRING }
                    },
                    required: ['text', 'pronunciation', 'translation']
                }
            }
        });
        
        return cleanAndParseJson(response.text || "{}");
    } catch (error) {
        console.error("Failed to send text chat message:", error);
        throw error;
    }
};

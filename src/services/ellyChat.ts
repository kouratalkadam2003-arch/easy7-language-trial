// Elly's cabin-scene chat, moved from the /api/elly Express route into the
// browser so the story works on static hosting.
//
// Two things were wrong with the old route: it needed a Node server, and it
// answered with the pre-v5 AI SDK data-stream format (`0:"..."`) while the
// installed @ai-sdk/react expects an SSE UI message stream — so the chat was
// already failing before this move. Talking to Gemini directly avoids the
// protocol entirely.

import { GoogleGenAI } from '@google/genai';
import { TEXT_MODEL } from '../constants';
import { getApiKey } from '../utils/apiKeyPool';

const ELLY_SYSTEM = `You are Elly, a kind young fisherwoman in the game "Kingdom of Sand". You rescued Laith, a prince betrayed and thrown into the sea. He is an Arabic speaker learning English.
MASTER CONVERSATION RULES:
1. Speak in SIMPLE SHORT English (A1-A2 level). Max 1-2 short sentences.
2. Be warm, patient, and encouraging. Never break character.
3. Use *asterisks for actions*.
4. If the user writes in Arabic, understand them and respond naturally in simple English.`;

export interface EllyTurn {
    role: 'user' | 'assistant';
    text: string;
}

// Offline / no-key fallback so the scene stays playable instead of dead-ending.
export function scriptedReply(userText: string): string {
    const t = userText.toLowerCase();
    if (t.includes('water') || t.includes('thirst') || t.includes('ماء')) return '*hands you a wooden cup of water* Here. Drink slowly.';
    if (t.includes('sleep') || t.includes('tired') || t.includes('rest') || t.includes('نوم')) return '*points to the straw bed* Rest here. You are safe now.';
    if (t.includes('where') || t.includes('أين')) return 'You are in my cabin, by the sea.';
    if (t.includes('thank') || t.includes('شكر')) return '*smiles warmly* You are welcome, Laith.';
    if (t.includes('who') || t.includes('name')) return 'I am Elly. I live here, by the sea.';
    if (t.includes('food') || t.includes('hungry') || t.includes('جوع')) return '*brings a bowl of warm soup* Eat. It will help you.';
    if (t.includes('goodbye') || t.includes('bye') || t.includes('leave')) return 'You are still weak. Stay a little more, please.';
    return '*listens carefully* I see. Talk more, Laith. Your English is good!';
}

export async function askElly(history: EllyTurn[], customSystem?: string): Promise<string> {
    const lastUserText = [...history].reverse().find(t => t.role === 'user')?.text || '';

    const apiKey = getApiKey();

    if (!apiKey) return scriptedReply(lastUserText);

    try {
        const ai = new GoogleGenAI({ apiKey });
        const result = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: history.map(t => ({
                role: t.role === 'user' ? 'user' : 'model',
                parts: [{ text: t.text }],
            })),
            config: { systemInstruction: customSystem || ELLY_SYSTEM },
        });
        return result.text?.trim() || scriptedReply(lastUserText);
    } catch (e) {
        console.warn('[elly] generateContent failed, using scripted reply:', e);
        return scriptedReply(lastUserText);
    }
}

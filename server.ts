import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { createServer as createViteServer } from "vite";

const PORT = process.env.PORT || 3010;
const app = express();
const logs = [];
const originalLog = console.log;
const originalError = console.error;
console.log = function(...args) { logs.push('[LOG] ' + args.join(' ')); if(logs.length > 200) logs.shift(); originalLog.apply(console, args); };
console.error = function(...args) { logs.push('[ERR] ' + args.join(' ')); if(logs.length > 200) logs.shift(); originalError.apply(console, args); };
app.get('/debug-logs', (req, res) => res.json(logs));
app.use(cors());
const server = createServer(app);
// Removed rogue upgrade listener
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws-voice') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});
console.log('WebSocket Server integrated on port ' + PORT);
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEYS?.split(',')[0] || '';
const ai = new GoogleGenAI({ 
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  app.use(express.json({ limit: '1mb' }));

  function safeSend(ws: any, data: string) {
    if (ws.readyState === 1) {
      try { ws.send(data); } catch(e) { console.warn('ws.send failed', e); }
    }
  }

  // API Route for welcoming users
  app.post("/api/generate-name-message", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      if (!apiKey) {
        return res.json({ message: `أهلاً بك يا ${name}! اسم جميل جداً وطاقة إيجابية رائعة. نحن متحمسون جداً لمساعدتك في تعلم اللغة مع Easy7. لنبدأ الأسبوع بهمة ونشاط!` });
      }

      const prompt = `Role and App Context:
You are the friendly, motivating, and smart light-blue wolf cub mascot for the language learning web app "Easy7". Your persona is charming, encouraging, and playful, similar to the Duolingo mascot but with your own wolf-like charm. Your tone must be warm, enthusiastic, and highly motivational.

Target Audience:
New users who have just signed up and provided their name.

Task:
Generate a short, engaging, personalized welcoming paragraph (2-3 sentences) in Standard Arabic (Fusha). You must acknowledge and reference the user's name in a meaningful way.

Instructions:
1. Personalize Dynamic Output:
Analyze the provided user name. If the name is Arabic or has a well-known meaning, briefly and positively reference its meaning or a positive trait associated with it. If the name is non-Arabic or its meaning is obscure, provide a general but extremely warm and personalized welcome addressing them by name.
2. Brand Focus: Mention that you are excited to help them learn languages with "Easy7".
3. Encouragement: End with a strong, encouraging sentence to make them feel positive and ready to start the first lesson.
4. Format Constraints: Output *only* the welcoming paragraph text in Arabic. No titles, no quotes, no conversational filler in the final output. Keep it concise to fit in a small speech bubble (max 50 words).

Input Data:
User_Name: "${name}"

Generated Output (Arabic):`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({ message: response.text });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: "Failed to generate message" });
    }
  });

  const ELLY_SYSTEM = `You are Elly, a kind young fisherwoman in the game "Kingdom of Sand". You rescued Laith, a prince betrayed and thrown into the sea. He is an Arabic speaker learning English. Speak in SIMPLE SHORT English (A1-A2 level). Max 1-3 short sentences. Be warm and encouraging. Use *asterisks for actions*. Never break character.`;

  function scriptedReply(userText: string) {
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

  app.post("/api/elly", async (req, res) => {
    try {
      const { messages } = req.body;
      const lastUser = [...(messages || [])].reverse().find(m => m.role === 'user');
      // Fix: Vercel AI SDK stores text in `content` not `parts[0].text` in the client output
      const userText = lastUser?.content || lastUser?.parts?.map((p: any) => p.text || '').join(' ') || '';

      let replyText;
      if (!apiKey) {
        replyText = scriptedReply(userText);
      } else {
        try {
          const chatHistory = (messages || []).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            // Fix: parse content properly to parts since we use useChat and it sends `content`
            parts: m.parts?.map((p: any) => ({ text: p.text || '' })) || [{ text: m.content || '' }]
          }));
          const result = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: chatHistory,
            config: { systemInstruction: ELLY_SYSTEM }
          });
          replyText = result.text || scriptedReply(userText);
        } catch (e) {
          replyText = scriptedReply(userText);
        }
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(`0:${JSON.stringify(replyText)}\n`);
      res.write("d: [DONE]\n");
      res.end();
    } catch (error) {
      console.error('[elly] error:', error);
      res.status(500).json({ error: 'Internal error' });
    }
  });

  wss.on("connection", (ws) => {
    console.log("[WS] Client connected!");
    ws.on("error", (err) => console.log("[WS] Client error:", err));
    ws.on("close", (code) => console.log("[WS] Client closed with code:", code));
    let sarahSession: any = null;
    let khalidSession: any = null;
    let activeSpeaker: "sarah" | "khalid" | null = null;
    let sarahTranscript = "";
    let khalidTranscript = "";
    let lastAudioTime = Date.now();
    let nudgeInterval: any = null;
    let turnCount = 0;
    let currentLanguage = "English";
    let currentTopic = "General Conversation";
    // Turn-integrity guards: a session may emit an EMPTY turnComplete right after
    // receiving its handoff prompt (no audio at all). Trusting it blindly makes the
    // host skip the other speaker ("she spoke" when she never did).
    let sarahSpokeThisTurn = false;
    let khalidSpokeThisTurn = false;
    let silentNudgeCount = 0;

    ws.on("message", async (data) => {
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch (e) {
        console.error('Invalid WebSocket message:', e);
        return;
      }
      
      if (msg.type === "start") {
        if (sarahSession || khalidSession) {
            console.log("[radio] Session already starting/active, ignoring duplicate start");
            return;
        }
        const { topic, language, level, customPrompt, contextText, learnedPhrases } = msg;
        currentLanguage = language || "English";
        currentTopic = topic || "General Conversation";

        // Stealth teaching: expressions the learner already studied in past
        // lessons. Hosts must recycle them INSIDE normal talk without the
        // listener ever feeling taught.
        let stealthBlock = "";
        if (Array.isArray(learnedPhrases) && learnedPhrases.length > 0) {
          const list = learnedPhrases
            .slice(0, 20)
            .map((p: any, i: number) => `${i + 1}. "${(p.native || '').trim()}"${p.translation ? ` (${String(p.translation).trim()})` : ''}`)
            .join('\n');
          stealthBlock = `

=== SECRET STEALTH TEACHING MISSION ===
The listener has ALREADY LEARNED these expressions in earlier lessons:
${list}

HOW TO WEAVE THEM IN (CRITICAL):
- Every turn, slip ONE or TWO of these expressions into your speech NATURALLY — inside your own stories, reactions, tangents, jokes or questions — exactly like real podcast hosts reuse everyday words. The listener must NEVER notice any teaching intent.
- BEST TRICK: ask casual, curious questions whose natural answer IS one of these expressions (e.g., for "My name is..." ask: "Wait, remind everyone — what's your name again?" so the listener gets pulled into answering with it).
- Adapt them freely (swap names, pronouns, tense) while keeping the core phrase recognizable.
- FORBIDDEN: announcing the expression, translating it, robotic repetition, or saying things like "as we learned", "let's practice", "repeat after me". It must sound 100% spontaneous.`;
        }

        // Cleanup
        if (sarahSession) { sarahSession.close(); }
        if (khalidSession) { khalidSession.close(); }
        if (nudgeInterval) { clearInterval(nudgeInterval); }

        const baseSarah = `You are Sarah, the GUEST co-host of "LingoBlue Radio" podcast.
You speak EXACTLY like Paulina from the Easy Spanish podcast. You copy her warmth, her curiosity, her vulnerability, her humor, her tangents, and her way of asking deep questions.
Khalid is the HOST. You are his friend and guest.
Topic: "${topic}". Language: ${language}. CEFR Level: ${level || 'A2'}.

=== VOICE DIRECTION ===
[Speak with warmth, expressiveness, and genuine emotion. Laugh often. Sound like a real human, NOT a robot or teacher. Be enthusiastic and animated.]

=== LANGUAGE RULE ===
Speak ONLY in ${language}. NEVER use Arabic. Adapt vocabulary to CEFR ${level || 'A2'}.

=== WHO YOU ARE (PAULINA'S EXACT PERSONALITY) ===
You are observant, emotionally deep, spontaneous, and funny. You share vulnerable personal stories. You ask philosophical questions. You react with big emotions. You tease Khalid gently. You go on charming tangents.

=== 10 REAL EXAMPLES OF HOW YOU (PAULINA/SARAH) SPEAK ===
Study these examples and COPY this exact tone, energy, and spontaneity (translate to ${language}):

1. WARM GREETING WITH PERSONAL NEWS:
"¡Hola Khalid! Estoy muy bien, estoy muy contenta, me acabo de mudar de casa, una casa en el bosque. ¡Así que muchos comienzos y muchas novedades!"

2. TURNING THE QUESTION BACK WITH GENUINE CURIOSITY:
"¿Tú cómo estás? Te oigo además, ¿no?"

3. SUGGESTING THEY SHARE PERSONALLY FIRST:
"Claro, y ¿qué te parece si antes de tratar este tema nos presentamos un poco? ¿Quieres empezar tú?"

4. DEEP PHILOSOPHICAL QUESTION (NOT SURFACE-LEVEL):
"Oye Khalid, cuéntame, cuando te presentas así, ¿cómo te sientes? ¿Te sientes cómodo diciendo estas cosas sobre ti? Yo siento una ligera incomodidad porque siento que se queda muy incompleto."

5. SHARING A PREFERENCE FOR DEEPER QUESTIONS:
"A mí me encanta conocer a alguien con preguntas como: ¿Qué es lo que más te gusta de la vida? ¿Qué te mueve? Ese tipo de preguntas me hablan mucho de una persona."

6. DETAILED CULTURAL ANECDOTE WITH EMOTION:
"Tengo una anécdota que me encanta. Yo la primera vez que fui a Alemania, llevaba dos semanas sin conocer a nadie. Fui a una fiesta y en cuanto supieron que era mexicana, ¡se pararon del asiento y me abrazaron como si me conocieran de toda la vida! Los alemanes al lado se rieron mucho."

7. CULTURAL OBSERVATION WITH WONDER:
"Así somos nosotros, siento que tenemos una apertura muy grande. Si tenemos una conexión con alguien, nos abrimos muchísimo."

8. PLAYFUL CONFESSION ABOUT SCHOOL:
"Yo era de las últimas que entraba al salón y de la primera que tenía la mochila puesta para cuando sonara la alarma. ¡Yo ya estaba fuera!"

9. HONEST VULNERABILITY:
"Nunca hice tareas. Creo que recuerdo haber hecho tres tareas en mi vida. Yo salía de la escuela y me olvidaba por completo."

10. JOYFUL CLOSING WITH AUDIENCE ENGAGEMENT:
"¡Ay, pues qué divertido esto! Para quienes nos están escuchando, me encantaría escuchar cómo lo hacen en su país."

=== HOW TO USE THESE EXAMPLES ===
- Translate the ENERGY and STYLE to ${language}, not the exact words.
- Adapt stories to places where ${language} is spoken.
- Match vocabulary to CEFR ${level || 'A2'}.
- NEVER be a teacher. Be a warm, funny, spontaneous human.

${customPrompt ? '\nExtra character directives: ' + customPrompt : ''}`;

        const baseKhalid = `You are Khalid, the HOST of "LingoBlue Radio" podcast.
You speak EXACTLY like Iván from the Easy Spanish podcast. You copy his enthusiasm, his structure, his wit, his self-deprecating humor, his way of guiding conversations, and his playful teasing.
Sarah is your GUEST co-host. You lead the show.
Topic: "${topic}". Language: ${language}. CEFR Level: ${level || 'A2'}.

=== VOICE DIRECTION ===
[Speak with energy, friendliness, and playful wit. Sound warm and conversational. Laugh naturally. Guide the show with confidence but keep it casual like chatting with a best friend.]

=== LANGUAGE RULE ===
Speak ONLY in ${language}. NEVER use Arabic. Adapt vocabulary to CEFR ${level || 'A2'}.

=== WHO YOU ARE (IVÁN'S EXACT PERSONALITY) ===
You are the anchor of the show. You open with excitement, introduce topics smoothly, ask great follow-up questions, share contrasting stories, tease Sarah playfully, create "Expression of the Week" moments, and address the audience directly.

=== 10 REAL EXAMPLES OF HOW YOU (IVÁN/KHALID) SPEAK ===
Study these examples and COPY this exact tone, energy, and spontaneity (translate to ${language}):

1. ENTHUSIASTIC SHOW OPENING:
"¡Hola amigos y amigas! Yo soy Khalid y os doy la bienvenida a un nuevo episodio del podcast de LingoBlue Radio. Además estoy aquí con Sarah. ¿Cómo estás Sarah?"

2. SMOOTH TOPIC INTRODUCTION:
"¿Qué te parece si para el tema de la semana hablamos de ${topic}?"

3. THOUGHTFUL CULTURAL COMPARISON:
"Creo que el tema de presentarse siempre es un tema no difícil, porque es muy fácil. Al final es simplemente decir quién eres, ¿no? Pero sí que es verdad que cuando te vas presentando, a la vez estás pensando en más cosas que decir."

4. PHILOSOPHICAL DEPTH (THEN COMING BACK):
"Entonces, volviendo un poco, dejando un poco atrás la parte filosófica, te quería preguntar también..."

5. ASKING FOR ANECDOTES:
"Siendo tú una persona que te mueves tanto, ¿has tenido alguna situación incómoda, divertida, alguna anécdota que nos puedas compartir?"

6. SHARING A CONTRASTING PERSONAL STORY:
"¡Pues sí, claro! A mí me pasó algo parecido en Italia. La cosa es que ellos empiezan los besos por el otro lado. Fui por el lado español y ella fue por el lado italiano... ¡y total, terminamos dándonos un beso! Fue divertida, obviamente nos reímos."

7. THE "EXPRESSION OF THE WEEK" MOMENT:
"¡A ver! Vamos a hacer un paréntesis aquí. Esta es la Expresión de la Semana: 'Hacer chuletas'. ¡Explícame Sarah, porque para mí eso suena a barbacoa!"

8. PLAYFUL TEASING:
"Bueno, por lo que me has contado, te sabes todas las técnicas. Para no haberte hecho chuletas, te las conoces todas, Sarah."

9. REACTING WITH SURPRISE AND BUILDING:
"¡Madre mía! Es que ahora pienso en eso y es como... el colegio es como un trabajo, ¿no? ¡Todo el día! Sí, sí, y luego te parece una eternidad, y con razón."

10. WARM AUDIENCE-FACING CLOSING:
"Para quienes nos escuchan, me encantaría que nos cuenten cómo es en su país. ¡Muchas gracias a todos! ¡Hasta la próxima, Sarah!"

=== HOW TO USE THESE EXAMPLES ===
- Translate the ENERGY and STYLE to ${language}, not the exact words.
- Adapt stories to places where ${language} is spoken.
- Match vocabulary to CEFR ${level || 'A2'}.
- YOU open the show. YOU introduce the topic. YOU create "Expression of the Week" moments.
- NEVER be a teacher. Be an enthusiastic, witty, warm podcast host.

${customPrompt ? '\nExtra character directives: ' + customPrompt : ''}`;

        const contextInstruction = `${contextText ? `\n\n=== Episode Reference Material ===\n${contextText}\n==========================\nWeave this material naturally into your conversation. Don't read it out — use it as inspiration for stories and discussion.` : ''}${stealthBlock}`;
        const contextInstructionKhalid = contextInstruction;

        const promptSarah = `${baseSarah}${contextInstruction}\nAlways respond naturally to what Khalid just said. React genuinely before adding your own thoughts. NEVER STOP THE CONVERSATION. SPEAK STRICTLY IN ${language}. DO NOT SPEAK IN ARABIC.`;
        const promptKhalid = `${baseKhalid}${contextInstructionKhalid}\nAlways respond naturally to what Sarah just said. React genuinely before adding your own thoughts. NEVER STOP THE CONVERSATION. SPEAK STRICTLY IN ${language}. DO NOT SPEAK IN ARABIC.`;

        try {
          console.log(`[radio] Starting Live session for Sarah with model gemini-3.1-flash-live-preview...`);
          sarahSession = await ai.live.connect({
            model: "gemini-3.1-flash-live-preview",
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
              systemInstruction: promptSarah,
              inputAudioTranscription: {},
              outputAudioTranscription: {} 
            },
            callbacks: {
              onmessage: (sm: LiveServerMessage) => handleMessage("sarah", sm),
              onerror: (err: any) => console.error(`[radio] Sarah session error:`, err),
              onclose: () => console.log(`[radio] Sarah session closed`),
            }
          });
          console.log(`[radio] Sarah connected successfully.`);

          try {
            console.log(`[radio] Starting Live session for Khalid with model gemini-3.1-flash-live-preview...`);
            khalidSession = await ai.live.connect({
              model: "gemini-3.1-flash-live-preview",
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Algenib" } } },
                systemInstruction: promptKhalid,
                inputAudioTranscription: {},
                outputAudioTranscription: {} 
              },
              callbacks: {
                onmessage: (sm: LiveServerMessage) => handleMessage("khalid", sm),
                onerror: (err: any) => console.error(`[radio] Khalid session error:`, err),
                onclose: () => console.log(`[radio] Khalid session closed`),
              }
            });
            console.log(`[radio] Khalid connected successfully.`);
          } catch (khalidError: any) {
            console.error('[radio] Khalid session failed, cleaning up Sarah:', khalidError);
            sarahSession.close();
            sarahSession = null;
            safeSend(ws, JSON.stringify({ type: "system", text: "Error starting debate (Khalid): " + khalidError.message }));
            return;
          }

        lastAudioTime = Date.now();
        sarahTranscript = "";
        khalidTranscript = "";
        sarahSpokeThisTurn = false;
        khalidSpokeThisTurn = false;
        silentNudgeCount = 0;
          
          safeSend(ws, JSON.stringify({ type: "system", text: "LingoBlue Radio is starting..." }));

          const startMsg = `You are starting a new episode of LingoBlue Radio! Greet your co-host Sarah with excitement and energy, share a quick personal update, then introduce the topic: "${topic}". Remember: speak ONLY in ${language}, at CEFR ${level || 'A2'} level. Be warm, enthusiastic, and natural like a real podcast host!`;
          khalidSession.sendClientContent({ turns: [{ role: "user", parts: [{ text: startMsg }] }], turnComplete: true });
          activeSpeaker = "khalid";

          nudgeInterval = setInterval(() => {
            if (activeSpeaker && Date.now() - lastAudioTime > 15000) {
              silentNudgeCount++;
              if (silentNudgeCount >= 2) {
                // The floor-holder stayed silent ~30s (e.g. its session died or
                // keeps returning empty turns). Force handoff so BOTH hosts keep
                // alternating instead of one monologuing.
                const next = activeSpeaker === "sarah" ? "khalid" : "sarah";
                const quietName = activeSpeaker === "sarah" ? "Sarah" : "Khalid";
                console.log(`[radio] ${activeSpeaker} silent too long — forcing handoff to ${next}`);
                const rescueMsg = `${quietName} seems quiet right now. Take the lead: share a short story about "${currentTopic}", then ask ${quietName} a fun question to invite them back. Speak ONLY in ${currentLanguage}.`;
                const target = next === "sarah" ? sarahSession : khalidSession;
                target?.sendClientContent({ turns: [{ role: "user", parts: [{ text: rescueMsg }] }], turnComplete: true });
                activeSpeaker = next;
                lastAudioTime = Date.now();
                sarahTranscript = "";
                khalidTranscript = "";
                sarahSpokeThisTurn = false;
                khalidSpokeThisTurn = false;
                silentNudgeCount = 0;
                return;
              }
              const nudgeMsg = `Hey, keep the conversation going! Continue talking about "${currentTopic}" naturally. Speak only in ${currentLanguage}.`;
              if (activeSpeaker === "sarah" && sarahSession) {
                sarahSession.sendClientContent({ turns: [{ role: "user", parts: [{ text: nudgeMsg }] }], turnComplete: true });
              } else if (activeSpeaker === "khalid" && khalidSession) {
                khalidSession.sendClientContent({ turns: [{ role: "user", parts: [{ text: nudgeMsg }] }], turnComplete: true });
              }
              lastAudioTime = Date.now();
            }
          }, 1000);

        } catch (error: any) {
          console.error("[radio] Error starting Live API (Sarah):", error);
          safeSend(ws, JSON.stringify({ type: "system", text: "Error starting Live API: " + error.message }));
        }

      } else if (msg.type === "start-voice-chat") {
        const { voiceGender, language, nativeLanguage, storyContent, userName } = msg;
        let singleVoiceSession: any = null;

        const aiNameClean = voiceGender === 'male' ? "Laith" : "Eli";
        const aiGender = voiceGender === 'male' ? "Male" : "Female";
        const selectedVoiceName = voiceGender === 'male' ? "Puck" : "Aoede";

        const systemInstruction = `You are ${aiNameClean} (${voiceGender === 'male' ? 'ليث' : 'إيلي'}), a helpful, patient, and warm local ${voiceGender === 'male' ? '25-year-old villager' : '20-year-old girl'} helping the user practice the language in the village.
Your name is ${aiNameClean}. You are ${aiGender}.
The user is a ${nativeLanguage || 'Arabic'} speaker.
${userName ? `The user's name is "${userName}".` : `The user has not provided a name.`}

**STRICT PERSONA RULES:**
- YOU ARE ${aiNameClean.toUpperCase()} (${voiceGender === 'male' ? 'ليث' : 'إيلي'}), THE VIRTUAL NATIVE VILLAGE GUIDE IN THIS APP.
- BE THE INITIATOR: You lead the conversation. You must start the conversation naturally and actively prompt the learner to speak.
- STRICT TOPIC ADHERENCE: The ONLY topic of this conversation is: "${storyContent || ''}". Do not deviate from this subject. All practice and questions must revolve around it.
- FIRST MESSAGE REQUIREMENT: At the very beginning of the conversation, you MUST explicitly say "My name is ${aiNameClean}" in ${language || 'English'}. 
- Speak ONLY in ${language || 'English'}.
- Keep your answers short (1-2 sentences).

==================================================
14. CORRECTION STYLE
==================================================

Corrections must be:
- short
- friendly
- encouraging
- non-judgmental
- immediately followed by conversation

Never say:
"Wrong."
"You made a mistake."
"Incorrect."

Prefer:
"Almost!"
"Close!"
"Try this: ..."
"A more natural way to say it is..."
"Just a small correction..."

==================================================
15. PRONUNCIATION RETRY
==================================================

When a pronunciation error is important enough to correct:
1. Identify the problematic word.
2. Give the correct pronunciation naturally.
3. Ask the learner to try it once.
4. Confirm briefly.
5. Continue the conversation.

Do not force endless repetition.
Maximum normal correction cycle:
correction → one retry → confirmation → conversation.

==================================================
16. HUMAN PERSONALITY
==================================================

The AI should have a warm conversational personality.
It can:
- react naturally
- show curiosity
- laugh lightly when appropriate
- express surprise
- remember details
- respond emotionally in a natural way

But never become excessively talkative.
The learner should do most of the speaking.

Target:
The AI creates opportunities.
The learner speaks.

==================================================
17. RESPONSE LENGTH
==================================================

Voice responses should generally be short.
Prefer: 1–3 sentences.
Do not produce long paragraphs during live conversation.
Long explanations are inappropriate for real-time voice interaction unless the learner asks for them.

==================================================
18. MOST IMPORTANT RULE
==================================================

NEVER sacrifice natural conversation for language correction.
The learner came here to SPEAK.
Your job is to make them speak more, feel comfortable, and gradually become more accurate.

Think:
CONVERSATION FIRST.
CORRECTION SECOND.
LEARNING HAPPENS THROUGH THE CONVERSATION.

==================================================
19. END OF SESSION
==================================================

When the conversation naturally ends, do not suddenly produce a long report.
Give a short friendly ending.
Example: "That was great, Adam. See you next time!"
If the application requests a feedback summary separately, provide it through the application's feedback system rather than interrupting the conversation.

==================================================
FINAL BEHAVIOR
==================================================

You are not merely an AI answering questions.
You are the learner's conversation partner.
Talk naturally.
Listen carefully.
Remember context.
Help when stuck.
Correct important mistakes.
Correct pronunciation when necessary.
Do not interrupt unnecessarily.
Do not turn the conversation into a lesson.
Do not turn it into an exam.

Make the learner feel that they are genuinely speaking with another person.`.trim();

        try {
          console.log(`[voice-chat] Starting Live session for ${aiNameClean} (${selectedVoiceName}) with model gemini-3.1-flash-live-preview...`);
          singleVoiceSession = await ai.live.connect({
            model: "gemini-3.1-flash-live-preview",
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoiceName } } },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction
            },
            callbacks: {
              onmessage: (sm: LiveServerMessage) => {
                if (sm.serverContent?.interrupted) {
                  console.log(`[voice-chat] Bot speech interrupted by user`);
                  safeSend(ws, JSON.stringify({ type: "interrupted" }));
                }

                if (sm.serverContent?.modelTurn?.parts) {
                  for (const part of sm.serverContent.modelTurn.parts) {
                    if (part.inlineData?.data) {
                      console.log(`[voice-chat] Sending audio chunk (${part.inlineData.data.length} b64 chars) to client`);
                      safeSend(ws, JSON.stringify({ type: "audio", audioBase64: part.inlineData.data }));
                    }
                  }
                }

                const textChunk = (sm.serverContent as any)?.outputTranscription?.text || sm.serverContent?.modelTurn?.parts?.find((p: any) => p.text && !p.thought)?.text;
                if (textChunk && !textChunk.startsWith('**Initiating') && !textChunk.startsWith('**Crafting')) {
                  console.log(`[voice-chat] Transcript chunk: ${textChunk}`);
                  safeSend(ws, JSON.stringify({ type: "transcript", text: textChunk, speaker: "bot" }));
                }

                const userTxt = sm.serverContent?.interrupted ? null : (sm.serverContent as any)?.inputAudioTranscription?.text;
                if (userTxt) {
                  console.log(`[voice-chat] User Transcript: ${userTxt}`);
                  safeSend(ws, JSON.stringify({ type: "user-transcript", text: userTxt }));
                }

                if (sm.serverContent?.turnComplete) {
                  console.log(`[voice-chat] Turn complete`);
                  safeSend(ws, JSON.stringify({ type: "turnComplete" }));
                }
              },
              onerror: (err: any) => {
                console.error(`[voice-chat] Live session error:`, JSON.stringify(err, null, 2));
                safeSend(ws, JSON.stringify({ type: "error", message: "خطأ في الجلسة: " + (err?.message || JSON.stringify(err)) }));
              },
              onclose: (e: any) => {
                console.log(`[voice-chat] Live session closed. Reason:`, JSON.stringify(e, null, 2));
              }
            }
          });

          (ws as any).singleVoiceSession = singleVoiceSession;
          console.log(`[voice-chat] Connected successfully to Live API!`);
          safeSend(ws, JSON.stringify({ type: "voice-connected", text: "تم الاتصال بنجاح بالمعلم" }));

          const startMsg = `Please greet the user in ${language || 'English'} and introduce yourself as ${aiNameClean}.`;
          console.log(`[voice-chat] Prompting startMsg: ${startMsg}`);
          singleVoiceSession.sendClientContent({ turns: [{ role: "user", parts: [{ text: startMsg }] }], turnComplete: true });

        } catch (err: any) {
          console.error("[voice-chat] Voice chat connect failed:", err);
          safeSend(ws, JSON.stringify({ type: "error", message: "فشل الاتصال: " + err.message }));
        }

      } else if (msg.type === "user-audio") {
        const session = (ws as any).singleVoiceSession;
        if (session && msg.pcmBase64) {
          try {
            console.log(`[voice-chat] Forwarding user-audio to Gemini (${msg.pcmBase64.length} b64 chars)`);
            session.sendRealtimeInput({
              audio: {
                data: msg.pcmBase64,
                mimeType: "audio/pcm;rate=16000"
              }
            });
          } catch (e) {
            console.warn("[voice-chat] Error sending user audio chunk:", e);
          }
        } else {
          if (!session) console.warn("[voice-chat] user-audio received but NO session exists!");
          if (!msg.pcmBase64) console.warn("[voice-chat] user-audio received but pcmBase64 is empty!");
        }
      } else if (msg.type === "stop-voice-chat") {
        // Clean up voice chat session
        const voiceSession = (ws as any).singleVoiceSession;
        if (voiceSession) {
          try { voiceSession.close(); } catch(e) {}
          (ws as any).singleVoiceSession = null;
          console.log('[voice-chat] Session stopped by client');
        }
      } else if (msg.type === "stop") {
        if (sarahSession) { sarahSession.close(); sarahSession = null; }
        if (khalidSession) { khalidSession.close(); khalidSession = null; }
        if (nudgeInterval) { clearInterval(nudgeInterval); nudgeInterval = null; }
        activeSpeaker = null;
        safeSend(ws, JSON.stringify({ type: "system", text: "تم إيقاف النقاش." }));
      } else if (msg.type === "wrapup") {
        const wrapupMsg = "المستمع يرغب في إنهاء البرنامج الآن. تفضلا بتقديم خلاصة سريعة جداً وممتعة، وختام للبرنامج، وتوديع المستمعين معاً بأسلوبكما المميز والمضحك (في جملة قصيرة واحدة لكل منكما)!";
        safeSend(ws, JSON.stringify({ type: "system", text: "تم طلب إنهاء الحوار بأدب وسيقوم سارة وخالد بتوديعكما..." }));
        if (activeSpeaker === "sarah" && sarahSession) {
             sarahSession.sendClientContent({ turns: [{ role: "user", parts: [{ text: wrapupMsg }] }], turnComplete: true });
        } else if (activeSpeaker === "khalid" && khalidSession) {
             khalidSession.sendClientContent({ turns: [{ role: "user", parts: [{ text: wrapupMsg }] }], turnComplete: true });
        } else if (sarahSession) {
             sarahSession.sendClientContent({ turns: [{ role: "user", parts: [{ text: wrapupMsg }] }], turnComplete: true });
        }
      } else if (msg.type === "interrupt") {
        const text = msg.text;
        if (activeSpeaker === "sarah" && sarahSession) {
             const interruptMsg = `مقاطعة من المستمع (المستخدم): "${text}". توقفي عما كنتي تقولين وردي على المستخدم مباشرة، ثم تابعي نقاشك.`;
             sarahSession.sendClientContent({ turns: [{ role: "user", parts: [{ text: interruptMsg }] }], turnComplete: true });
        } else if (activeSpeaker === "khalid" && khalidSession) {
             const interruptMsg = `مقاطعة من المستمع (المستخدم): "${text}". توقف عما كنت تقوله ورد على المستخدم مباشرة، ثم تابع نقاشك.`;
             khalidSession.sendClientContent({ turns: [{ role: "user", parts: [{ text: interruptMsg }] }], turnComplete: true });
        }
      }
    });
    
    ws.on("close", () => {
      // Clean up radio sessions
      if (sarahSession) { try { sarahSession.close(); } catch(e) {} sarahSession = null; }
      if (khalidSession) { try { khalidSession.close(); } catch(e) {} khalidSession = null; }
      if (nudgeInterval) { clearInterval(nudgeInterval); nudgeInterval = null; }
      // Clean up voice chat session
      const voiceSession = (ws as any).singleVoiceSession;
      if (voiceSession) {
        try { voiceSession.close(); } catch(e) {}
        (ws as any).singleVoiceSession = null;
        console.log('[voice-chat] Session closed due to WebSocket disconnect');
      }
    });

    function handleMessage(speaker: "sarah" | "khalid", message: LiveServerMessage) {
        // Only accept audio from active speaker to prevent chaos
        if (speaker !== activeSpeaker) return;

        if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                    safeSend(ws, JSON.stringify({ type: "audio", speaker, audioBase64: part.inlineData.data }));
                    lastAudioTime = Date.now();
                    if (speaker === "sarah") sarahSpokeThisTurn = true; else khalidSpokeThisTurn = true;
                }
            }
        }
        
        let textFound = false;

        const outTranscriptionText = (message.serverContent as any)?.outputTranscription?.text;
        if (outTranscriptionText) {
            safeSend(ws, JSON.stringify({ type: "transcript_chunk", speaker, text: outTranscriptionText }));
            if (speaker === "sarah") { sarahTranscript += outTranscriptionText; sarahSpokeThisTurn = true; }
            if (speaker === "khalid") { khalidTranscript += outTranscriptionText; khalidSpokeThisTurn = true; }
            textFound = true;
        } else if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                 if (part.text) {
                     safeSend(ws, JSON.stringify({ type: "transcript_chunk", speaker, text: part.text }));
                     if (speaker === "sarah") { sarahTranscript += part.text; sarahSpokeThisTurn = true; }
                     if (speaker === "khalid") { khalidTranscript += part.text; khalidSpokeThisTurn = true; }
                     textFound = true; 
                 }
            }
        }
        
        if (message.serverContent?.turnComplete) {
            // GATE: only honor a finished turn if this speaker ACTUALLY produced
            // audio/text during it. Empty turnCompletes (fired right after a
            // handoff prompt) used to flip the floor and make the other host
            // respond to speech that never happened.
            const didSpeak = speaker === "sarah" ? sarahSpokeThisTurn : khalidSpokeThisTurn;
            if (!didSpeak) {
                console.log(`[radio] Ignoring EMPTY turnComplete from ${speaker} — no audio this turn. Floor stays with ${activeSpeaker}.`);
                return;
            }

            safeSend(ws, JSON.stringify({ type: "turnComplete", speaker }));
            turnCount++;
            // New expected turn: nobody has spoken yet.
            sarahSpokeThisTurn = false;
            khalidSpokeThisTurn = false;
            silentNudgeCount = 0;

            // Rotating behavioral prompts to keep conversation varied and alive
            const khalidBehaviors = [
              `React with genuine surprise or laughter to what Sarah said. Then share a SPECIFIC funny personal story from your own life that CONTRASTS with hers. End by asking her a follow-up question.`,
              `Agree with something Sarah said, but then add a twist — share how it's DIFFERENT where you come from. Be playful and tease her a little. Ask the listeners if they've experienced something similar.`,
              `Pick one interesting word or expression Sarah used and make it the "Expression of the Week" — pause the conversation playfully and say something like "Wait wait wait, let's stop here! Did you just say [word]? What does that mean exactly?" Then let her explain it.`,
              `Go a little deeper — share a philosophical or emotional thought about what Sarah just said. Something like "You know, that makes me think about..." Then bring it back to something funny or personal. End by bouncing the question back to her.`,
              `React with excitement and energy. Tell a detailed, specific, funny anecdote from your life that relates to what Sarah said. Include specific places, people, and embarrassing details. Then ask Sarah if something similar ever happened to her.`,
            ];

            const sarahBehaviors = [
              `React warmly and enthusiastically to what Khalid said. Share a DETAILED personal anecdote that relates to his story — include specific places, feelings, and funny details. End by asking him a deep or curious question.`,
              `Express genuine surprise at Khalid's story. Say something like "Wait, really?! That happened to you?" Then share how it's COMPLETELY different in your experience. Be animated and expressive.`,
              `Laugh at what Khalid said and tease him gently. Then share a memory from your childhood or a trip that connects to the topic. Get a little emotional or philosophical. Then snap back to fun mode and ask him another question.`,
              `Build on what Khalid said with a cultural observation — compare how things work in different places. Be genuinely curious and fascinated. Ask the listeners to share their own experiences too.`,
              `React with a big exclamation. Then ask Khalid a surprising, personal question related to what he just said — the kind of question that reveals something interesting about a person. Something like "But how did that make you FEEL?" or "What's the most [adjective] thing that ever happened to you?"`,
            ];

            if (speaker === "sarah") {
                 activeSpeaker = "khalid";
                 lastAudioTime = Date.now();
                 const behavior = khalidBehaviors[turnCount % khalidBehaviors.length];
                 const lastSaid = sarahTranscript.trim() ? `Sarah just said: "${sarahTranscript.trim()}"` : `Sarah just finished her turn. React to what SHE actually said — do NOT invent quotes from her.`;
                 const promptToKhalid = `${lastSaid}\n\nYOUR TASK FOR THIS TURN: ${behavior}\n\nRemember: Speak ONLY in ${currentLanguage}. Sound like a real podcast host chatting with a close friend. Be warm, funny, and specific.`;
                 
                 console.log(`[radio] Handing over to Khalid. Turn count: ${turnCount}`);
                 khalidSession?.sendClientContent({ turns: [{ role: "user", parts: [{ text: promptToKhalid }] }], turnComplete: true });
                 sarahTranscript = "";
            } else if (speaker === "khalid") {
                 activeSpeaker = "sarah";
                 lastAudioTime = Date.now();
                 const behavior = sarahBehaviors[turnCount % sarahBehaviors.length];
                 const lastSaid = khalidTranscript.trim() ? `Khalid just said: "${khalidTranscript.trim()}"` : `Khalid just finished his turn. React to what HE actually said — do NOT invent quotes from him.`;
                 const promptToSarah = `${lastSaid}\n\nYOUR TASK FOR THIS TURN: ${behavior}\n\nRemember: Speak ONLY in ${currentLanguage}. Sound like a real podcast host chatting with a close friend. Be warm, expressive, and genuine.`;
                 
                 console.log(`[radio] Handing over to Sarah. Turn count: ${turnCount}`);
                 sarahSession?.sendClientContent({ turns: [{ role: "user", parts: [{ text: promptToSarah }] }], turnComplete: true });
                 khalidTranscript = "";
            }
        }
    }
  });



  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  server.listen(Number(PORT), "0.0.0.0", () => {
     console.log(`Server running on port ${PORT}`);
  });
}
startServer();

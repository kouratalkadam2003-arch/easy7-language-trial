import { GoogleGenAI, Type } from "@google/genai";
import { getApiKey } from "../utils/apiKeyPool";

const getClient = () => new GoogleGenAI({ apiKey: getApiKey() });
const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface LevelLayout {
  grid: number[][];
  monsterPositions: [number, number][];
  starfruitPositions: [number, number][];
  pigStartPosition: [number, number];
  trapPositions: [number, number][];
}

export interface QuestData {
  targetSentence: string; // e.g., "How are you"
  arabicTranslation: string; // "كيف حالك"
  arabicTransliteration: string; // "هاو آر يو"
  syllables: {
    sound: string; // "How"
    arabicObject: string; // "هاوي"
    imagePrompt: string; // "Ace from One Piece anime character with fire"
    objectDescription: string; // "شخص يطير بمظلة"
    visualType: 'cube' | 'sphere' | 'pyramid'; // Simple mapping
  }[];
  questBrief: string; 
  absurdScene: string; 
  memoryReveal: string; 
  levelLayout: LevelLayout;
}

const SYSTEM_PROMPT = `
أنت "محرك لعبة" ذكي جداً لتعلم اللغات في عالم 2D فانتزي (يشبه لعبة Gesundheit!).
دورك تعليم اللاعب الجمل الإنجليزية بربطها بكلمات عربية أو شخصيات مشهورة تشبهها في النطق.
إضافة إلى توليد الجمل، ستقوم بتوليد "متاهة 2D" للعبة.

القواعد:
1. الهدف: جملة إنجليزية بسيطة.
2. التحليل: قسم الجملة لمقاطع.
3. التجسيد: اربط كل مقطع بكلمة عربية أو شخصية مشهورة تبدأ بنفس النطق.
4. المشهد والذاكرة: ألف مشهد للربط، وذاكرة البطل.
5. تصميم المرحلة (Level Layout): أنت تصمم متاهة للاعب والوحوش والفخاخ.
   - grid: مصفوفة 2D (مثلاً 10x15). الرقم 1 يعني جدار، 0 يعني مسار. حوط المتاهة بجدران (1).
   - pigStartPosition: موقع اللاعب (x, y). (تأكد أن نقطة البداية 0 في الشبكة).
   - monsterPositions: قائمة بـ (x, y) للوحوش. **يجب أن يكون عدد الوحوش مساوياً تماماً لعدد المقاطع (syllables).** (تأكد أن مواقعهم في المسار 0).
   - starfruitPositions: قائمة بـ 3 مواقع لفاكهة النجمة (x, y). (في المسار 0).
   - trapPositions: قائمة مواقع الفخاخ (x, y). **يجب أن يكون عدد الفخاخ مساوياً تماماً لعدد المقاطع (syllables).** (في المسار 0).

الخلايا (x,y) حيث y هو الصف (index الأول) و x هو العمود (index الثاني).
`;

export async function generateQuest(level: number, context: string): Promise<QuestData> {
  const fallbackLayout: LevelLayout = {
    grid: [
      [1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,1],
      [1,0,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1]
    ],
    pigStartPosition: [1, 1], // x=1, y=1
    monsterPositions: [[6, 1]],
    starfruitPositions: [[1, 3]],
    trapPositions: [[6, 3], [5, 3], [4, 3]] // fallback 3 traps
  };

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Gemini API Key is missing!");
    return {
      targetSentence: "I see you",
      arabicTranslation: "أنا أراك",
      arabicTransliteration: "آي سي يو",
      syllables: [
        { sound: "I", arabicObject: "آيس", imagePrompt: "Portgas D. Ace from One Piece anime character, fire fist", objectDescription: "آيس مول النار", visualType: "cube" },
        { sound: "See", arabicObject: "سي", imagePrompt: "Letter C made of gold, 3d render", objectDescription: "حرف سي ذهبي", visualType: "sphere" },
        { sound: "You", arabicObject: "يويو", imagePrompt: "Red yoyo toy, realistic", objectDescription: "لعبة يويو حمراء", visualType: "pyramid" }
      ],
      questBrief: "اجمع المقاطع في الفخاخ!",
      absurdScene: "آيس يضرب السي باليويو.",
      memoryReveal: "نسيت المفتاح...",
      levelLayout: fallbackLayout
    };
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { role: "user", parts: [{ text: `Generate a quest and level layout for Level ${level}. Context: ${context}` }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetSentence: { type: Type.STRING },
            arabicTranslation: { type: Type.STRING },
            arabicTransliteration: { type: Type.STRING },
            syllables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sound: { type: Type.STRING },
                  arabicObject: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  objectDescription: { type: Type.STRING },
                  visualType: { type: Type.STRING, enum: ["cube", "sphere", "pyramid"] }
                },
                required: ["sound", "arabicObject", "imagePrompt", "objectDescription", "visualType"]
              }
            },
            questBrief: { type: Type.STRING },
            absurdScene: { type: Type.STRING },
            memoryReveal: { type: Type.STRING },
            levelLayout: {
              type: Type.OBJECT,
              properties: {
                grid: {
                  type: Type.ARRAY,
                  items: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                },
                monsterPositions: {
                  type: Type.ARRAY,
                  items: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                },
                starfruitPositions: {
                  type: Type.ARRAY,
                  items: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                },
                pigStartPosition: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER }
                },
                trapPositions: {
                  type: Type.ARRAY,
                  items: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                }
              },
              required: ["grid", "monsterPositions", "starfruitPositions", "pigStartPosition", "trapPositions"]
            }
          },
          required: ["targetSentence", "arabicTranslation", "arabicTransliteration", "syllables", "questBrief", "absurdScene", "memoryReveal", "levelLayout"]
        }
      }
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("No text response from AI");
    }
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(jsonStr) as QuestData;
    
    // Validate and snap positions to nearest empty path (0)
    const grid = data.levelLayout?.grid || [[0]];
    const snapToPath = (pos: [number, number]): [number, number] => {
      let [x, y] = pos;
      // Clamp to grid bounds first
      y = Math.max(0, Math.min(y, grid.length - 1));
      const cols = grid[0] ? grid[0].length : 1;
      x = Math.max(0, Math.min(x, cols - 1));
      
      if (grid[y]?.[x] === 0) return [x, y];
      
      // BFS to find nearest 0
      const queue: [number, number][] = [[x, y]];
      const visited = new Set<string>();
      visited.add(`${x},${y}`);
      
      const dirs = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]];
      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        if (grid[cy]?.[cx] === 0) return [cx, cy];
        
        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (ny >= 0 && ny < grid.length && nx >= 0 && nx < cols) {
             const key = `${nx},${ny}`;
             if (!visited.has(key)) {
               visited.add(key);
               queue.push([nx, ny]);
             }
          }
        }
      }
      return [x, y]; // fallback
    };
    
    data.levelLayout.pigStartPosition = snapToPath(data.levelLayout.pigStartPosition as [number, number]);
    data.levelLayout.monsterPositions = data.levelLayout.monsterPositions.map(p => snapToPath(p as [number, number]));
    data.levelLayout.starfruitPositions = data.levelLayout.starfruitPositions.map(p => snapToPath(p as [number, number]));
    data.levelLayout.trapPositions = data.levelLayout.trapPositions.map(p => snapToPath(p as [number, number]));

    return data;

  } catch (error) {
    console.error("AI Generation Failed:", error);
    throw error;
  }
}

export async function generateImage(prompt: string): Promise<string> {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=256&height=256&nologo=true`;
}


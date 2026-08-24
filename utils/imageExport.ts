
import { GameTurn, TextChatMessage, StoryContentType, Flashcard, ReviewContentType, MemoryDrillItem, SpincoCard } from "../types";

const PADDING = 40;
const FONT_FAMILY = "'Fredoka One', cursive, sans-serif";
const LINE_HEIGHT = 1.5;

const STAGE_CONFIG: Record<string, { bgColor: string; textColor: string; texts: string[] }> = {
    story: {
        bgColor: '#d946ef',
        textColor: '#ffff00',
        texts: ["المرحلة الثانية", "قراءة النص", "استمع ثم اقرء"],
    },
    translation: {
        bgColor: '#1e90ff',
        textColor: '#ffff00',
        texts: ["المرحلة الاولى", "الترجمة"],
    },
    game: {
        bgColor: '#ff1493',
        textColor: '#ffff00',
        texts: ["المرحلة الثالثة", "اللعبة وفيها", "سنختبر مدى", "فهمك للنص"],
    },
    memory: {
        bgColor: '#ef4444',
        textColor: '#ffff00',
        texts: ["المرحلة الرابعة", "مرحلة الترسيخ", "تكرار، تخيل، وتطبيق", "لذاكرة حديدية"],
    },
    review: {
        bgColor: '#ffff00',
        textColor: '#000000',
        texts: ["المرحلة السابعة", "مراجعة البطاقات"],
    },
    chat: { 
        bgColor: '#6c757d',
        textColor: '#ffffff',
        texts: ["المرحلة السادسة", "مرحلة كشف الحقيقة", "(المحادثة)"],
    }
};

const UI_TEXTS_AR_EXPORT = {
    vocabTitle: "المفردات الأساسية",
    grammarTitle: "نصيحة نحو/قواعد",
};


/**
 * Wraps text to fit inside a maximum width on a canvas.
 * @returns The y-coordinate after the wrapped text is drawn.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  isRtl: boolean = false
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let totalHeight = 0;

  const drawLine = (lineContent: string, yPos: number) => {
      const drawX = isRtl ? x + maxWidth : x;
       if (isRtl) {
        ctx.textAlign = 'right';
      } else {
        if (ctx.textAlign !== 'center') {
             ctx.textAlign = 'left';
        }
      }
      ctx.fillText(lineContent.trim(), drawX, yPos);
  };

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      drawLine(line, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      totalHeight += lineHeight;
    } else {
      line = testLine;
    }
  }
  drawLine(line, currentY);
  totalHeight += lineHeight;
  return totalHeight;
}


async function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string) {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Generic Canvas Generators & Blob Converters ---

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Canvas to Blob conversion failed"));
            }
        }, 'image/png');
    });
}

export async function generateSeparatorCanvas(stageId: string, dayNumber: number, topicTitle: string): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const canvasWidth = 800;
    const canvasHeight = 600;

    const config = STAGE_CONFIG[stageId] || STAGE_CONFIG.chat;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Background color
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Text styling
    ctx.fillStyle = config.textColor;
    ctx.font = `bold 52px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Stroked text for the "comic" effect
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;

    const totalTextHeight = config.texts.length * 60;
    let startY = (canvasHeight - totalTextHeight) / 2 + 30;

    config.texts.forEach(text => {
        ctx.strokeText(text, canvasWidth / 2, startY);
        ctx.fillText(text, canvasWidth / 2, startY);
        startY += 60; // Line spacing
    });

    return canvas;
}

export async function generateStoryCanvas(title: string, content: string, isTargetLanguage: boolean = false): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const canvasWidth = 800;
    const contentWidth = canvasWidth - PADDING * 2;
    let currentY = PADDING;

    // --- Measurement Pass ---
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    const titleHeight = wrapText(ctx, title, PADDING, 0, contentWidth, 28 * LINE_HEIGHT);
    ctx.font = `18px ${FONT_FAMILY}`;
    const contentHeight = wrapText(ctx, content, PADDING, 0, contentWidth, 18 * LINE_HEIGHT);
    
    // --- Drawing Pass ---
    canvas.width = canvasWidth;
    canvas.height = PADDING + titleHeight + 20 + contentHeight + PADDING;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    wrapText(ctx, title, PADDING, currentY, contentWidth, 28 * LINE_HEIGHT, !isTargetLanguage);
    currentY += titleHeight + 20;
    
    ctx.font = `18px ${FONT_FAMILY}`;
    wrapText(ctx, content, PADDING, currentY, contentWidth, 18 * LINE_HEIGHT, !isTargetLanguage);

    return canvas;
}

export async function generateGameTurnCanvas(turn: GameTurn): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const canvasWidth = 800;
    const contentWidth = canvasWidth - PADDING * 2;
    let currentY = PADDING;

    // Measurement Pass
    ctx.font = `bold 24px ${FONT_FAMILY}`;
    const scenarioHeight = wrapText(ctx, turn.scenario, 0, 0, contentWidth, 24 * LINE_HEIGHT, true);
    
    ctx.font = `18px ${FONT_FAMILY}`;
    let choicesHeight = 0;
    turn.choices.forEach((choice, index) => {
        const choiceText = `${index + 1}. ${choice.text} (${choice.translation})`;
        choicesHeight += wrapText(ctx, choiceText, 0, 0, contentWidth, 18 * LINE_HEIGHT);
        choicesHeight += 10;
    });

    // Drawing Pass
    canvas.width = canvasWidth;
    canvas.height = PADDING + scenarioHeight + 30 + choicesHeight + PADDING;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold 24px ${FONT_FAMILY}`;
    wrapText(ctx, turn.scenario, PADDING, currentY, contentWidth, 24 * LINE_HEIGHT, true);
    currentY += scenarioHeight + 30;

    ctx.font = `18px ${FONT_FAMILY}`;
    turn.choices.forEach((choice, index) => {
        const choiceText = `${index + 1}. ${choice.text} (${choice.translation})`;
        const choiceHeight = wrapText(ctx, choiceText, PADDING, currentY, contentWidth, 18 * LINE_HEIGHT);
        currentY += choiceHeight + 10;
    });

    return canvas;
}

export async function generateVocabularyCanvas(vocabulary: StoryContentType['basicVocabulary']): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const canvasWidth = 800;
    const contentWidth = canvasWidth - PADDING * 2;
    let currentY = PADDING;

    const title = UI_TEXTS_AR_EXPORT.vocabTitle;

    // --- Measurement Pass ---
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    const titleHeight = wrapText(ctx, title, 0, 0, contentWidth, 28 * LINE_HEIGHT, true);
    
    let listHeight = 20; 
    ctx.font = `18px ${FONT_FAMILY}`;
    vocabulary.forEach(item => {
        const text = `${item.word} : ${item.translation}`;
        listHeight += wrapText(ctx, text, 0, 0, contentWidth, 18 * LINE_HEIGHT, true);
        listHeight += 15; 
    });

    // --- Drawing Pass ---
    canvas.width = canvasWidth;
    canvas.height = PADDING + titleHeight + 20 + listHeight + PADDING;

    // Card background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#f43f5e'; 
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(ctx.lineWidth, ctx.lineWidth);
    ctx.lineTo(ctx.lineWidth, canvas.height - ctx.lineWidth);
    ctx.stroke();

    ctx.textBaseline = 'top';
    
    // Title
    ctx.fillStyle = '#be123c'; 
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    wrapText(ctx, title, PADDING, currentY, contentWidth, 28 * LINE_HEIGHT, true);
    currentY += titleHeight + 30;

    // List
    ctx.fillStyle = '#334155';
    ctx.font = `18px ${FONT_FAMILY}`;
    vocabulary.forEach(item => {
        const itemY = currentY;
        
        ctx.textAlign = 'right';
        ctx.fillText(item.translation, canvasWidth - PADDING, itemY);

        ctx.textAlign = 'left';
        (ctx as any).direction = 'ltr';
        ctx.fillText(item.word, PADDING, itemY);
        
        currentY += (18 * LINE_HEIGHT) + 15;
    });

    return canvas;
}

export async function generateGrammarCanvas(grammarTip: StoryContentType['grammarTip']): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const canvasWidth = 800;
    const contentWidth = canvasWidth - PADDING * 2;
    let currentY = PADDING;

    // --- Measurement Pass ---
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    const titleHeight = wrapText(ctx, `✨ ${grammarTip.title}`, 0, 0, contentWidth, 28 * LINE_HEIGHT, true);
    ctx.font = `18px ${FONT_FAMILY}`;
    const tipHeight = wrapText(ctx, grammarTip.tip, 0, 0, contentWidth, 18 * LINE_HEIGHT, true);

    // --- Drawing Pass ---
    canvas.width = canvasWidth;
    canvas.height = PADDING + titleHeight + 20 + tipHeight + PADDING;
    
    // Card background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(ctx.lineWidth, ctx.lineWidth);
    ctx.lineTo(ctx.lineWidth, canvas.height - ctx.lineWidth);
    ctx.stroke();

    ctx.textBaseline = 'top';
    
    // Title
    ctx.fillStyle = '#1e40af';
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    wrapText(ctx, `✨ ${grammarTip.title}`, PADDING, currentY, contentWidth, 28 * LINE_HEIGHT, true);
    currentY += titleHeight + 20;

    // Tip
    ctx.fillStyle = '#334155';
    ctx.font = `18px ${FONT_FAMILY}`;
    wrapText(ctx, grammarTip.tip, PADDING, currentY, contentWidth, 18 * LINE_HEIGHT, true);
    
    return canvas;
}

const MESSAGES_PER_CANVAS = 4;

export async function generateChatCanvas(messages: TextChatMessage[]): Promise<HTMLCanvasElement[]> {
    const canvases: HTMLCanvasElement[] = [];
    if (!messages || messages.length === 0) return canvases;
    
    const messageChunks: TextChatMessage[][] = [];
    for (let i = 0; i < messages.length; i += MESSAGES_PER_CANVAS) {
        messageChunks.push(messages.slice(i, i + MESSAGES_PER_CANVAS));
    }

    for (const chunk of messageChunks) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const canvasWidth = 800;
        const contentWidth = canvasWidth - PADDING * 2;
        const bubbleMaxWidth = contentWidth * 0.7;
        let currentY = PADDING;

        // --- Measurement Pass for this chunk ---
        let chunkHeight = PADDING;
        chunk.forEach(msg => {
            let bubbleContentHeight = 0;
            const isA = msg.speaker === 'A';
            
            ctx.font = `bold 16px ${FONT_FAMILY}`;
            bubbleContentHeight += wrapText(ctx, msg.speakerName, 0, 0, bubbleMaxWidth - 30, 16 * LINE_HEIGHT, !isA) + 5;
            ctx.font = `18px ${FONT_FAMILY}`;
            bubbleContentHeight += wrapText(ctx, msg.text, 0, 0, bubbleMaxWidth - 30, 18 * LINE_HEIGHT, false) + 10;
            ctx.font = `14px ${FONT_FAMILY}`;
            bubbleContentHeight += wrapText(ctx, `النطق: ${msg.pronunciation}`, 0, 0, bubbleMaxWidth - 30, 14 * LINE_HEIGHT, true) + 5;
            bubbleContentHeight += wrapText(ctx, `الترجمة: ${msg.translation}`, 0, 0, bubbleMaxWidth - 30, 14 * LINE_HEIGHT, true);

            const bubbleHeight = bubbleContentHeight + 30;
            chunkHeight += bubbleHeight + 15;
        });
        chunkHeight += PADDING;

        // --- Drawing Pass for this chunk ---
        canvas.width = canvasWidth;
        canvas.height = chunkHeight;
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textBaseline = 'top';

        for(const msg of chunk) {
            const isA = msg.speaker === 'A';
            let bubbleContentHeight = 0;

            ctx.font = `bold 16px ${FONT_FAMILY}`;
            bubbleContentHeight += wrapText(ctx, msg.speakerName, 0, 0, bubbleMaxWidth - 30, 16 * LINE_HEIGHT, !isA) + 5;
            ctx.font = `18px ${FONT_FAMILY}`;
            bubbleContentHeight += wrapText(ctx, msg.text, 0, 0, bubbleMaxWidth - 30, 18 * LINE_HEIGHT, false) + 10;
            ctx.font = `14px ${FONT_FAMILY}`;
            bubbleContentHeight += wrapText(ctx, `النطق: ${msg.pronunciation}`, 0, 0, bubbleMaxWidth - 30, 14 * LINE_HEIGHT, true) + 5;
            bubbleContentHeight += wrapText(ctx, `الترجمة: ${msg.translation}`, 0, 0, bubbleMaxWidth - 30, 14 * LINE_HEIGHT, true);

            const bubbleHeight = bubbleContentHeight + 30;
            const bubbleX = isA ? PADDING : canvasWidth - PADDING - bubbleMaxWidth;

            ctx.fillStyle = isA ? '#fecdd3' : '#dbeafe'; 
            ctx.beginPath();
            (ctx as any).roundRect(bubbleX, currentY, bubbleMaxWidth, bubbleHeight, 15);
            ctx.fill();
            
            let textY = currentY + 15;
            const textX = bubbleX + 15;
            
            ctx.fillStyle = '#1e293b'; 
            ctx.font = `bold 16px ${FONT_FAMILY}`;
            textY += wrapText(ctx, msg.speakerName, textX, textY, bubbleMaxWidth - 30, 16 * LINE_HEIGHT, !isA) + 5;
            
            ctx.font = `18px ${FONT_FAMILY}`;
            textY += wrapText(ctx, msg.text, textX, textY, bubbleMaxWidth - 30, 18 * LINE_HEIGHT, false) + 10;
            
            ctx.fillStyle = '#475569';
            ctx.font = `14px ${FONT_FAMILY}`;
            textY += wrapText(ctx, `النطق: ${msg.pronunciation}`, textX, textY, bubbleMaxWidth - 30, 14 * LINE_HEIGHT, true) + 5;
            wrapText(ctx, `الترجمة: ${msg.translation}`, textX, textY, bubbleMaxWidth - 30, 14 * LINE_HEIGHT, true);

            currentY += bubbleHeight + 15;
        }

        canvases.push(canvas);
    }
    
    return canvases;
}

export async function generateMemoryDrillCanvas(drill: MemoryDrillItem, title: string): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const canvasWidth = 800;
    const contentWidth = canvasWidth - PADDING * 2;
    let currentY = PADDING;

    const drillText = `
    1. Shadowing: ${drill.originalSentence}
    2. Visualize: ${drill.visualizationPrompt}
    3. Variations:
    - ${drill.substitutions[0]?.fullSentence}
    - ${drill.substitutions[1]?.fullSentence}
    `;

    // Measurement
    ctx.font = `bold 24px ${FONT_FAMILY}`;
    const titleHeight = wrapText(ctx, title, 0, 0, contentWidth, 24 * LINE_HEIGHT, true);
    ctx.font = `18px ${FONT_FAMILY}`;
    const paragraphHeight = wrapText(ctx, drillText, 0, 0, contentWidth, 18 * LINE_HEIGHT, true);
    
    // Drawing
    canvas.width = canvasWidth;
    canvas.height = PADDING + titleHeight + 20 + paragraphHeight + PADDING;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold 24px ${FONT_FAMILY}`;
    wrapText(ctx, title, PADDING, currentY, contentWidth, 24 * LINE_HEIGHT, true);
    currentY += titleHeight + 20;

    ctx.font = `18px ${FONT_FAMILY}`;
    wrapText(ctx, drillText, PADDING, currentY, contentWidth, 18 * LINE_HEIGHT, true);
    
    return canvas;
}

async function generateFlashcardsCanvas(flashcards: Flashcard[]): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const canvasWidth = 1200;
    const cardWidth = 280;
    const cardHeight = 150;
    const cardsPerRow = Math.floor((canvasWidth - PADDING) / (cardWidth + PADDING));
    const numRows = Math.ceil(flashcards.length / cardsPerRow);
    const canvasHeight = PADDING + numRows * (cardHeight + PADDING);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    flashcards.forEach((card, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        const x = PADDING + col * (cardWidth + PADDING);
        const y = PADDING + row * (cardHeight + PADDING);

        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        (ctx as any).roundRect(x, y, cardWidth, cardHeight, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = `bold 16px ${FONT_FAMILY}`;
        wrapText(ctx, card.translation, x + cardWidth / 2, y + 40, cardWidth - 20, 16 * LINE_HEIGHT, true);
        ctx.font = `14px ${FONT_FAMILY}`;
        wrapText(ctx, card.originalText, x + cardWidth / 2, y + 90, cardWidth - 20, 14 * LINE_HEIGHT);
    });

    return canvas;
}

export async function generateReviewStageCanvas(content: ReviewContentType): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const canvasWidth = 800;
    const contentWidth = canvasWidth - PADDING * 2;
    let currentY = PADDING;

    const title = "مراجعة البطاقات";
    const body = `تم إنشاء ${content.flashcards.length} بطاقة تعليمية جديدة بناءً على هذا الدرس. يمكنك مراجعتها الآن بالانتقال إلى قسم "البطاقات".`;
    
    // Measurement
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    const titleHeight = wrapText(ctx, title, 0, 0, contentWidth, 28 * LINE_HEIGHT, true);
    ctx.font = `18px ${FONT_FAMILY}`;
    const bodyHeight = wrapText(ctx, body, 0, 0, contentWidth, 18 * LINE_HEIGHT, true);

    // Drawing
    canvas.width = canvasWidth;
    canvas.height = PADDING + titleHeight + 20 + bodyHeight + PADDING;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    currentY += wrapText(ctx, title, canvas.width / 2, currentY, contentWidth, 28 * LINE_HEIGHT, true) + 20;

    ctx.font = `18px ${FONT_FAMILY}`;
    wrapText(ctx, body, canvas.width / 2, currentY, contentWidth, 18 * LINE_HEIGHT, true);

    return canvas;
}

export async function generateSpincoCardCanvas(card: SpincoCard): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const canvasWidth = 600;
    const canvasHeight = 800;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let currentY = 100;

    // Visual Equation
    ctx.fillStyle = '#1e293b';
    ctx.font = `18px ${FONT_FAMILY}`;
    currentY += wrapText(ctx, card.visualEquation, canvasWidth / 2, currentY, canvasWidth - 60, 18 * LINE_HEIGHT, true);
    currentY += 40;

    // Foreign Word
    ctx.fillStyle = '#be123c';
    ctx.font = `bold 48px ${FONT_FAMILY}`;
    ctx.fillText(card.foreignWord, canvasWidth / 2, currentY);
    currentY += 60;

    // Meaning
    ctx.fillStyle = '#15803d';
    ctx.font = `bold 32px ${FONT_FAMILY}`;
    ctx.fillText(card.meaning, canvasWidth / 2, currentY);
    currentY += 50;

    return canvas;
}

export async function downloadSpincoCardAsImage(card: SpincoCard, filename: string) {
    const canvas = await generateSpincoCardCanvas(card);
    await downloadCanvasAsImage(canvas, filename);
}

export async function downloadStoryAsImage(title: string, content: string, filename: string, isTargetLanguage: boolean = false) {
    const canvas = await generateStoryCanvas(title, content, isTargetLanguage);
    await downloadCanvasAsImage(canvas, filename);
}

export async function downloadGameTurnAsImage(turn: GameTurn, filename: string) {
    const canvas = await generateGameTurnCanvas(turn);
    await downloadCanvasAsImage(canvas, filename);
}

export async function downloadChatAsImage(messages: TextChatMessage[], filename: string) {
    const canvases = await generateChatCanvas(messages);
    for(let i=0; i<canvases.length; i++){
        await downloadCanvasAsImage(canvases[i], filename.replace('.png', `_part_${i+1}.png`));
    }
}

export async function downloadFlashcardsAsImage(flashcards: Flashcard[], filename: string) {
    const canvas = await generateFlashcardsCanvas(flashcards);
    await downloadCanvasAsImage(canvas, filename);
}

export async function getStoryBlob(title: string, content: string, isTargetLanguage: boolean = false): Promise<Blob> {
    const canvas = await generateStoryCanvas(title, content, isTargetLanguage);
    return canvasToBlob(canvas);
}

export async function getGameTurnBlob(turn: GameTurn): Promise<Blob> {
    const canvas = await generateGameTurnCanvas(turn);
    return canvasToBlob(canvas);
}

export async function getChatBlobs(messages: TextChatMessage[]): Promise<Blob[]> {
    const canvases = await generateChatCanvas(messages);
    return Promise.all(canvases.map(canvasToBlob));
}

export async function getVocabularyBlob(vocabulary: StoryContentType['basicVocabulary']): Promise<Blob> {
    const canvas = await generateVocabularyCanvas(vocabulary);
    return canvasToBlob(canvas);
}

export async function getGrammarBlob(grammarTip: StoryContentType['grammarTip']): Promise<Blob> {
    const canvas = await generateGrammarCanvas(grammarTip);
    return canvasToBlob(canvas);
}

export async function getFlashcardsBlob(flashcards: Flashcard[]): Promise<Blob> {
    const canvas = await generateFlashcardsCanvas(flashcards);
    return canvasToBlob(canvas);
}

export async function getReviewStageBlob(content: ReviewContentType): Promise<Blob> {
    const canvas = await generateReviewStageCanvas(content);
    return canvasToBlob(canvas);
}

export async function getSeparatorBlob(stageId: string, dayNumber: number, topicTitle: string): Promise<Blob> {
    const canvas = await generateSeparatorCanvas(stageId, dayNumber, topicTitle);
    return canvasToBlob(canvas);
}
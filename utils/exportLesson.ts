
import { Language, Topic, LessonExportData, GameChoice, TextChatMessage } from '../types';
import { 
    generateGameTurnCanvas, 
    generateStoryCanvas, 
    generateChatCanvas, 
    generateReviewStageCanvas,
    generateSeparatorCanvas,
    generateVocabularyCanvas,
    generateGrammarCanvas,
    generateMemoryDrillCanvas
} from './imageExport';

declare const jspdf: any;
declare const saveAs: any;
declare const JSZip: any;


const addCanvasToPdf = async (doc: any, canvas: HTMLCanvasElement, yPos: { y: number }): Promise<void> => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    if (!canvas || canvas.width < 10 || canvas.height < 10) {
        console.warn("Skipping empty or invalid canvas for PDF export.");
        return;
    }

    const imgData = canvas.toDataURL('image/png', 0.9);
    const imgProps = doc.getImageProperties(imgData);
    const imgHeight = (imgProps.height * (pageWidth - margin)) / imgProps.width;

    if (yPos.y + imgHeight + margin > pageHeight) {
        doc.addPage();
        yPos.y = margin; 
    }
    
    doc.addImage(imgData, 'PNG', margin / 2, yPos.y, pageWidth - margin, imgHeight, undefined, 'FAST');
    yPos.y += imgHeight + 10; 
};


export const prepareAllCanvasesForExport = async (
    data: LessonExportData,
    onProgress: (progress: string) => void
): Promise<Record<string, HTMLCanvasElement>> => {
    const canvases: Record<string, HTMLCanvasElement> = {};
    
    const conversationCanvases = await generateChatCanvas(data.textChatContent.messages);

    const lessonStructure = [
        { id: 'translation', content: [
            { name: 'Story_Translated', generator: () => generateStoryCanvas(data.topic.title, data.story.translatedText, false) }
        ]},
        { id: 'story', content: [
            { name: 'Story_Original', generator: () => generateStoryCanvas(data.topic.title, data.story.originalText, true) }
        ]},
        { id: 'game', content: data.game.map((turn, i) => ({ name: `Game_Turn_${i + 1}`, generator: () => generateGameTurnCanvas(turn) })) },
        { id: 'memory', content: data.memory.drills.map((drill, i) => ({ name: `Memory_Drill_${i + 1}`, generator: () => generateMemoryDrillCanvas(drill, `Drill ${i + 1}`) })) },
        { id: 'chat', content: [
            ...conversationCanvases.map((canvas, i) => ({ 
                name: `conversation_part_${i + 1}`, 
                generator: () => Promise.resolve(canvas) 
            })),
            { name: `vocabulary`, generator: () => generateVocabularyCanvas(data.story.basicVocabulary) },
            { name: `grammar`, generator: () => generateGrammarCanvas(data.story.grammarTip) }
        ]},
        { id: 'review', content: [{ name: 'Review', generator: () => generateReviewStageCanvas(data.review) }] }
    ];

    const totalItems = lessonStructure.reduce((acc, stage) => acc + stage.content.length + 1, 0);
    let progressCounter = 0;
    
    let stageCounter = 1;
    for (const stage of lessonStructure) {
        const stagePrefix = String(stageCounter).padStart(2, '0');
        
        progressCounter++;
        onProgress(`(${progressCounter}/${totalItems}) Separator: ${stage.id}`);
        const separatorFilename = `${stagePrefix}_Separator_${stage.id}.png`;
        canvases[separatorFilename] = await generateSeparatorCanvas(stage.id, data.dayNumber, data.topic.title);
        
        let itemCounter = 1;
        for (const contentItem of stage.content) {
            const itemPrefix = String(itemCounter).padStart(2, '0');
            const filename = `${stagePrefix}-${itemPrefix}_${contentItem.name.replace(/ /g, '_')}.png`;
            progressCounter++;
            onProgress(`(${progressCounter}/${totalItems}) Item: ${contentItem.name}`);
            canvases[filename] = await contentItem.generator();
            itemCounter++;
        }
        stageCounter++;
    }

    onProgress('Export files are ready!');
    return canvases;
};


export const generateSingleLanguageLessonPDF = async (
    canvases: Record<string, HTMLCanvasElement>,
    fileName: string,
    onProgress: (progress: string) => void
): Promise<void> => {
    onProgress('Assembling PDF...');
    const { jsPDF } = jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true,
    });
    const yPos = { y: 20 };
    
    const sortedKeys = Object.keys(canvases).sort();
    const canvasArray = sortedKeys.map(key => canvases[key]);

    for(let i = 0; i < canvasArray.length; i++) {
        onProgress(`Adding page ${i + 1}/${canvasArray.length} to PDF`);
        await addCanvasToPdf(doc, canvasArray[i], yPos);
    }

    onProgress('Saving PDF...');
    doc.save(fileName);
};

export const generateMultiLanguageLessonPDF = async (
    allLessonsCanvases: Record<string, Record<string, HTMLCanvasElement>>,
    languages: Language[],
    topic: Topic,
    dayNumber: number,
    onProgress: (progress: string) => void
): Promise<void> => {
    onProgress('Assembling multi-language PDF...');
    const { jsPDF } = jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true,
    });
    const yPos = { y: 20 };

    for (const lang of languages) {
        const langCanvases = allLessonsCanvases[lang.code];
        if (!langCanvases) continue;

        onProgress(`Processing ${lang.englishName}...`);
        
        const titleCanvas = document.createElement('canvas');
        titleCanvas.width = 800;
        titleCanvas.height = 200;
        const ctx = titleCanvas.getContext('2d')!;
        ctx.fillStyle = '#fdf2f8';
        ctx.fillRect(0, 0, 800, 200);
        ctx.fillStyle = '#db2777';
        ctx.textAlign = 'center';
        ctx.font = 'bold 48px sans-serif';
        ctx.fillText(`${lang.flag} ${lang.englishName}`, 400, 100);
        ctx.font = '32px sans-serif';
        ctx.fillText(topic.title, 400, 160);
        
        await addCanvasToPdf(doc, titleCanvas, yPos);
        
        const sortedKeys = Object.keys(langCanvases).sort();
        const canvasArray = sortedKeys.map(key => langCanvases[key]);

        for(let i = 0; i < canvasArray.length; i++) {
            onProgress(`[${lang.englishName}] Adding page ${i + 1}/${canvasArray.length}`);
            await addCanvasToPdf(doc, canvasArray[i], yPos);
        }
    }

    onProgress('Saving PDF...');
    doc.save(`Multi-Language-Lesson-${dayNumber}-${topic.title.replace(/ /g, '_')}.pdf`);
};

const getSingleLanguageLessonHTMLContent = (data: LessonExportData): string => {
    const escape = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    
    const renderChoices = (choices: GameChoice[]) => choices.map(c => `<li>${escape(c.text)} (${escape(c.translation)}) ${c.isCorrect ? '<b>(Correct)</b>' : ''}</li>`).join('');
    const renderMessages = (messages: TextChatMessage[]) => messages.map(m => `<p><b>${escape(m.speakerName)}:</b> ${escape(m.text)}</p>`).join('');

    const renderSeparator = (stageId: string) => {
        return `<div class="separator"><h2>${escape(stageId)}</h2></div>`;
    }

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>Lesson: ${escape(data.topic.title)}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'; direction: rtl; padding: 20px; background-color: #f4f4f9; color: #333; }
                .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                h1, h2, h3 { color: #d63384; }
                h1 { text-align: center; }
                .stage { margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
                .story-box, .game-turn, .scene, .spinco-card { margin-bottom: 15px; padding: 15px; border-radius: 5px; background: #fdf2f8; }
                .target-lang { direction: ltr; text-align: left; }
                ul { padding-right: 20px; }
                li { margin-bottom: 5px; }
                .separator { text-align: center; margin-bottom: 40px; padding: 20px; background-color: #e9ecef; border-radius: 8px; }
                .separator h2 { margin: 0 0 10px 0; color: #495057; }
                .separator p { margin: 0; color: #6c757d; font-size: 1.1em; }
                .highlight-text { color: #dc2626; font-weight: 900; }
                .target-word-red { color: #ff0000; font-weight: 900; text-decoration: underline; }
                .imagine-keyword { color: #4f46e5; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${data.language.flag} ${escape(data.topic.title)} - Day ${data.dayNumber}</h1>
                
                ${renderSeparator('Translation')}
                <div class="stage">
                    <h3>1. Translation</h3>
                    <div class="story-box">
                        <h4>Translation (Arabic)</h4>
                        <p>${escape(data.story.translatedText).replace(/\n/g, '<br>')}</p>
                    </div>
                </div>

                ${renderSeparator('Story')}
                <div class="stage">
                    <h3>2. Story</h3>
                    <div class="story-box target-lang">
                        <h4>Original (${escape(data.language.englishName)})</h4>
                        <p>${escape(data.story.originalText).replace(/\n/g, '<br>')}</p>
                    </div>
                </div>

                ${renderSeparator('Game')}
                <div class="stage">
                    <h3>3. Game</h3>
                    ${data.game.map((turn, i) => `
                        <div class="game-turn">
                            <h4>Turn ${i + 1}</h4>
                            <p><b>Scenario:</b> ${escape(turn.scenario)}</p>
                            <ul>${renderChoices(turn.choices)}</ul>
                        </div>
                    `).join('')}
                </div>
                
                ${renderSeparator('Memory')}
                <div class="stage">
                    <h3>4. Memory Drills</h3>
                    ${data.memory.drills.map((drill, i) => `
                        <div class="spinco-card">
                            <h4>Drill ${i + 1}</h4>
                            <p><b>Original:</b> ${drill.originalSentence}</p>
                            <p><b>Visualize:</b> ${drill.visualizationPrompt}</p>
                        </div>
                    `).join('')}
                </div>

                ${renderSeparator('Chat')}
                <div class="stage">
                    <h3>5. Chat</h3>
                    <div class="story-box target-lang">${renderMessages(data.textChatContent.messages)}</div>
                </div>

                ${renderSeparator('Review')}
                 <div class="stage">
                    <h3>6. Review Flashcards</h3>
                    <ul>
                        ${data.review.flashcards.map(card => `<li><b>${escape(card.original)}:</b> ${escape(card.translation)}</li>`).join('')}
                    </ul>
                </div>

            </div>
        </body>
        </html>
    `;
};


export const generateSingleLanguageLessonHTML = async (
    data: LessonExportData,
    onProgress: (progress: string) => void
): Promise<void> => {
    onProgress('Generating HTML content...');
    const htmlContent = getSingleLanguageLessonHTMLContent(data);
    onProgress('Saving HTML file...');
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `Lesson-${data.dayNumber}-${data.language.englishName}-${data.topic.title.replace(/ /g, '_')}.html`);
};

export const exportMultiLanguageLessonAsHtmlZip = async (
    allLessonsData: Record<string, LessonExportData>,
    languages: Language[],
    topic: Topic,
    dayNumber: number,
    onProgress: (progress: string) => void
): Promise<void> => {
    onProgress('Starting multi-language HTML ZIP generation...');
    const zip = new JSZip();

    for (const lang of languages) {
        const data = allLessonsData[lang.code];
        if (!data) continue;
        
        onProgress(`Generating HTML for ${lang.englishName}...`);
        const htmlContent = getSingleLanguageLessonHTMLContent(data);
        const filename = `Lesson-${dayNumber}-${lang.englishName}-${topic.title.replace(/ /g, '_')}.html`;
        zip.file(filename, htmlContent);
    }
    
    onProgress('Compressing HTML files into ZIP...');
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Multi-Language-Lesson-${dayNumber}-${topic.title.replace(/ /g, '_')}-HTML.zip`);
};

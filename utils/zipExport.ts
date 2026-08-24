import { Language, Topic, LessonExportData } from '../types';
import { canvasToBlob } from './imageExport';

declare const JSZip: any;
declare const saveAs: any;

export const exportSingleLanguageLessonAsZip = async (
    canvases: Record<string, HTMLCanvasElement>,
    fileName: string,
    onProgress: (progress: string) => void
): Promise<void> => {
    onProgress('Assembling ZIP file...');
    const zip = new JSZip();

    const entries = Object.entries(canvases);
    for (let i = 0; i < entries.length; i++) {
        const [filename, canvas] = entries[i];
        onProgress(`Compressing image ${i + 1}/${entries.length}`);
        const blob = await canvasToBlob(canvas);
        zip.file(filename, blob);
    }
    
    onProgress('Saving ZIP file...');
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, fileName);
};

export const exportMultiLanguageLessonAsZip = async (
    allLessonsCanvases: Record<string, Record<string, HTMLCanvasElement>>,
    languages: Language[],
    topic: Topic,
    dayNumber: number,
    onProgress: (progress: string) => void
): Promise<void> => {
    onProgress('Assembling multi-language ZIP...');
    const zip = new JSZip();

    for (const lang of languages) {
        const langCanvases = allLessonsCanvases[lang.code];
        if (!langCanvases) continue;
        
        onProgress(`Processing ${lang.englishName}...`);
        const langFolder = zip.folder(lang.englishName.replace(/ /g, '_'));
        if (!langFolder) continue;

        const entries = Object.entries(langCanvases);
        for (let i = 0; i < entries.length; i++) {
            const [filename, canvas] = entries[i];
            onProgress(`[${lang.englishName}] Compressing image ${i + 1}/${entries.length}`);
            const blob = await canvasToBlob(canvas);
            langFolder.file(filename, blob);
        }
    }
    
    onProgress('Saving main ZIP file...');
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Multi-Language-Lesson-${dayNumber}-${topic.title.replace(/ /g, '_')}.zip`);
};
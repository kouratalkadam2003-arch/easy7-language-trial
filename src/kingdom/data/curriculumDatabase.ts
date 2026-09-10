import manifestData from './curriculumManifest.json';
import { SubjectCurriculum, LearningItemTemplate } from '../types/learning';
import { SpacedRepetitionEngine } from '../engine/spacedRepetition';

export interface DialogueMessage {
  speaker: string;
  speakerName: string;
  gender: string;
  text: string;
  translation: string;
  pronunciation: string;
}

export interface DetailedLesson {
  id: string;
  dayNumber: number;
  level: string;
  languageCode: string;
  stationId: string;
  title: string;
  grammarTip?: { title: string; tip: string };
  nextLessonLink?: string;
  messages: DialogueMessage[];
  storyOriginalText?: string;
  storyTranslatedText?: string;
  storyNativeScriptText?: string;
}

// Lazy loader for full dialogue content to keep bundle light
let cachedAllLessons: DetailedLesson[] | null = null;

export async function getAllLessonsDetailed(): Promise<DetailedLesson[]> {
  if (!cachedAllLessons) {
    const data = await import('./allLessonsData.json');
    cachedAllLessons = data.default as unknown as DetailedLesson[];
  }
  return cachedAllLessons;
}

export function getCurriculumManifest(): SubjectCurriculum[] {
  return manifestData.subjects as unknown as SubjectCurriculum[];
}

export async function findLessonDetails(level: string, langCode: string, dayNumber: number): Promise<DetailedLesson | null> {
  const all = await getAllLessonsDetailed();
  return (
    all.find(
      (l) =>
        l.level.toLowerCase() === level.toLowerCase() &&
        l.languageCode.toLowerCase() === langCode.toLowerCase() &&
        l.dayNumber === dayNumber
    ) || null
  );
}

export async function addEntireLessonToDeck(
  engine: SpacedRepetitionEngine,
  subjectName: string,
  levelTitle: string,
  unitTitle: string,
  lessonTitle: string,
  level: string,
  langCode: string,
  dayNumber: number
): Promise<number> {
  const lesson = await findLessonDetails(level, langCode, dayNumber);
  if (!lesson || !lesson.messages || lesson.messages.length === 0) return 0;

  let addedCount = 0;
  lesson.messages.forEach((msg, idx) => {
    const itemId = `${langCode}_${level}_d${dayNumber}_msg_${idx + 1}`;
    engine.addIndividualItem({
      id: itemId,
      subject: subjectName,
      sourceLevelId: levelTitle,
      sourceUnitId: unitTitle,
      sourceLessonId: lessonTitle,
      primaryText: msg.text,
      secondaryText: `${msg.translation} • ${msg.pronunciation}`,
      contextOrNotes: `${msg.speakerName} (${idx + 1}/10): ${msg.translation}`,
      categoryTag: idx % 2 === 0 ? 'Dialogue-A' : 'Dialogue-B',
    });
    addedCount++;
  });

  return addedCount;
}

export async function addEntireStationToDeck(
  engine: SpacedRepetitionEngine,
  subjectName: string,
  levelTitle: string,
  unitTitle: string,
  level: string,
  langCode: string,
  startDay: number,
  endDay: number
): Promise<number> {
  let totalAdded = 0;
  for (let day = startDay; day <= endDay; day++) {
    const lesson = await findLessonDetails(level, langCode, day);
    if (lesson) {
      const count = await addEntireLessonToDeck(
        engine,
        subjectName,
        levelTitle,
        unitTitle,
        `اليوم ${day}: ${lesson.title}`,
        level,
        langCode,
        day
      );
      totalAdded += count;
    }
  }
  return totalAdded;
}

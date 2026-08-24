import React, { useState, useEffect, useMemo } from 'react';
import { Language, Topic, RadioContentType } from '../types/remix_types';
import { TOPICS, AI_RADIO_PROMPT_TEMPLATE, CREATOR_PERSONA, RADIO_SCHEMA, TEXT_MODEL } from '../constants';
import { getLessonFromFirebase, saveLessonToFirebase } from '../../services/firebase';
import { generateContentWithRetry } from '../../services/ai';
import { cleanAndParseJson } from '../../utils/json';
import RadioStage from './RadioStage';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface GlobalRadioScreenProps {
    language: Language;
    nativeLanguage: Language;
    level: string;
    onBack: () => void;
}

export const GlobalRadioScreen: React.FC<GlobalRadioScreenProps> = ({
    language,
    nativeLanguage,
    level,
    onBack
}) => {
    const allTopics = useMemo(() => Object.values(TOPICS).flatMap(s => s.topics), []);
    const [selectedTopic, setSelectedTopic] = useState<{topic: Topic, dayNumber: number} | null>(null);

    // Player state
    const [radioContent, setRadioContent] = useState<RadioContentType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    const loadOrGenerateRadio = async (topic: Topic, dayNumber: number, forceRegenerate = false) => {
        setIsLoading(true);
        setError(false);
        try {
            let storyText = "محادثة عامة وشيقة حول موضوع الدرس لمتعلمي اللغة";
            const existingLesson = await getLessonFromFirebase(language.code, level, dayNumber);
            
            if (!forceRegenerate && existingLesson && existingLesson.radio) {
                setRadioContent(existingLesson.radio);
                setIsLoading(false);
                return;
            }
            
            if (existingLesson && existingLesson.story && existingLesson.story.dialog) {
                storyText = existingLesson.story.dialog.map((d: any) => `${d.speaker} (Arabic: ${d.translation}): ${d.text}`).join('\n');
            }

            // Generate it!
            let promptTemplate = AI_RADIO_PROMPT_TEMPLATE
                .replace(/{STORY_TEXT}/g, storyText)
                .replace(/{TOPIC_TITLE}/g, topic.title)
                .replace(/{PROFICIENCY_LEVEL}/g, level);
                
            promptTemplate = promptTemplate
                .replace(/{NATIVE_LANGUAGE_NAME}/g, nativeLanguage.englishName)
                .replace(/{TARGET_LANGUAGE_NAME}/g, language.englishName)
                .replace(/{CHAR_A_NAME}/g, "A")
                .replace(/{CHAR_B_NAME}/g, "B")
                .replace(/{JP_CH_RULE_PLACEHOLDER}/g, "");

            const systemInstruction = CREATOR_PERSONA
                .replace(/{NATIVE_LANGUAGE_NAME}/g, nativeLanguage.englishName)
                .replace(/{TARGET_LANGUAGE_NAME}/g, language.englishName)
                .replace(/{PROFICIENCY_LEVEL}/g, level);

            const response = await generateContentWithRetry({
                model: TEXT_MODEL,
                contents: promptTemplate,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: RADIO_SCHEMA
                }
            });

            const textData = cleanAndParseJson(response.text || "{}");
            
            // Save it
            saveLessonToFirebase(language.code, level, dayNumber, 'radio', textData);
            
            setRadioContent(textData);
        } catch (err) {
            console.error("Failed to load/generate radio content", err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectTopic = (topic: Topic, index: number) => {
        const dayNumber = index + 1;
        setSelectedTopic({ topic, dayNumber });
        loadOrGenerateRadio(topic, dayNumber);
    };

    if (selectedTopic) {
        return (
            <div className="w-full h-full bg-slate-900 flex flex-col fixed inset-0 z-50">
                <RadioStage 
                    content={radioContent}
                    isLoading={isLoading}
                    error={error}
                    onRetry={() => loadOrGenerateRadio(selectedTopic.topic, selectedTopic.dayNumber)}
                    onRegenerate={() => loadOrGenerateRadio(selectedTopic.topic, selectedTopic.dayNumber, true)}
                    language={language}
                    nativeLanguage={nativeLanguage}
                    topic={selectedTopic.topic}
                    dayNumber={selectedTopic.dayNumber}
                    level={level}
                    onBack={() => {
                        setSelectedTopic(null);
                        setRadioContent(null);
                    }}
                    onNextStage={() => {
                        setSelectedTopic(null);
                        setRadioContent(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-slate-50 flex flex-col relative pb-20 md:pb-0 overflow-y-auto" dir="rtl">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center sticky top-0 z-10 shadow-md">
                <button 
                    onClick={onBack}
                    className="p-2 ml-2 rounded-full hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 rotate-180" />
                </button>
                <h1 className="text-xl font-bold">راديو الذكاء الاصطناعي</h1>
            </div>

            <div className="p-4 flex-1 max-w-5xl mx-auto w-full">
                <div className="text-center mb-8 mt-4">
                    <span className="text-6xl block mb-4">📻</span>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">الدروس (حلقات الراديو)</h2>
                    <p className="text-slate-600 max-w-lg mx-auto">
                        استمع لحلقات الراديو التفاعلية! 
                        جميع الحلقات مرتبة حسب خطة الدروس ومتاحة دائماً للاستماع.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allTopics.map((topic, index) => {
                        const dayNumber = index + 1;
                        return (
                            <button
                                key={topic.id}
                                onClick={() => handleSelectTopic(topic, index)}
                                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-start hover:shadow-lg transition-all hover:-translate-y-1 text-right w-full group"
                            >
                                <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 relative">
                                    <img 
                                        src={`/assets/radio_covers/lesson_${dayNumber}_cover.svg`}
                                        alt={topic.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/assets/radio_covers/lesson_1_cover.svg'; // fallback
                                        }}
                                    />
                                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                        الحلقة {dayNumber}
                                    </div>
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg">
                                            <ChevronRight className="w-6 h-6 rotate-180 ml-1" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 w-full truncate mb-1">
                                    {topic.title}
                                </h3>
                                <div className="w-full flex justify-between items-center text-sm text-slate-500 mt-2">
                                    <span>الاستماع الآن</span>
                                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                                        <ChevronRight className="w-4 h-4 rotate-180" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GlobalRadioScreen;

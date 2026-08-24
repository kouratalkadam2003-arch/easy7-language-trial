import React from 'react';
import { StoryContentType, Topic } from '../types';
import { LessonViewProps } from './LessonView';
import StoryStage from './StoryStage';

interface ListeningStageProps extends Omit<LessonViewProps, 'previousTopics' | 'onCompleteLesson' | 'onUpdateReview' | 'onClearCacheKey'> {
    story: StoryContentType | null;
    isLoading: boolean;
    error: boolean;
    onRetry: () => void;
    onNextStage?: () => void;
    previousTopics: Topic[];
    selectedVoice?: SpeechSynthesisVoice | null;
}

const ListeningStage: React.FC<ListeningStageProps> = (props) => {
    return (
        <StoryStage 
            {...props} 
            onRegenerate={() => {}} // Listening stage doesn't have its own regenerate, it relies on story
            initialMode="listen" 
        />
    );
};

export default ListeningStage;

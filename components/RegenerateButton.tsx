import React, { useState } from 'react';
import { RefreshIcon } from './icons';
import Spinner from './Spinner';
import { LessonStage } from '../types';

interface RegenerateButtonProps {
    stage: LessonStage;
    isLoading: boolean;
    isDisabled: boolean;
    onRegenerate: (stage: LessonStage) => void;
}

const UI_TEXTS_AR = {
    regenerate: "إعادة إنشاء",
    confirmTitle: "تأكيد إعادة الإنشاء",
    confirmMessage: "هل أنت متأكد أنك تريد إعادة إنشاء محتوى هذه المرحلة؟ سيؤدي هذا إلى استهلاك موارد إضافية وقد يستغرق بعض الوقت.",
    confirmAction: "تأكيد",
    cancelAction: "إلغاء",
};

const ConfirmationModal: React.FC<{
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
    return (
        <div 
            className="fixed inset-0 bg-purple-900 bg-opacity-60 flex justify-center items-center z-50" 
            onClick={onCancel}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-md text-center transform transition-all" 
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-purple-800 mb-4">{UI_TEXTS_AR.confirmTitle}</h3>
                <p className="text-purple-600 mb-8">{UI_TEXTS_AR.confirmMessage}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="juicy-button from-gray-400 to-gray-500 flex-1">
                        {UI_TEXTS_AR.cancelAction}
                    </button>
                    <button onClick={onConfirm} className="juicy-button from-yellow-500 to-orange-500 flex-1">
                        {UI_TEXTS_AR.confirmAction}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RegenerateButton: React.FC<RegenerateButtonProps> = ({ stage, isLoading, isDisabled, onRegenerate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleButtonClick = () => {
        if (!isLoading && !isDisabled) {
            setIsModalOpen(true);
        }
    };

    const handleConfirm = () => {
        setIsModalOpen(false);
        onRegenerate(stage);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {isModalOpen && <ConfirmationModal onConfirm={handleConfirm} onCancel={handleCancel} />}
            <button
                onClick={handleButtonClick}
                disabled={isDisabled || isLoading}
                className="juicy-button from-yellow-500 to-orange-500 flex items-center justify-center gap-2"
                title={UI_TEXTS_AR.regenerate}
            >
                {isLoading ? <Spinner size="h-5 w-5" /> : <RefreshIcon className="w-5 h-5" />}
                {UI_TEXTS_AR.regenerate}
            </button>
        </>
    );
};

export default RegenerateButton;

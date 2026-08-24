
import React, { useMemo } from 'react';

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
    shadowing: {
        bgColor: '#db2777', 
        textColor: '#ffffff',
        texts: ["المرحلة الثالثة", "القراءة التكرارية"],
    },
    visualization: {
        bgColor: '#7c3aed', 
        textColor: '#ffffff',
        texts: ["المرحلة الرابعة", "التخيل"],
    },
    substitution: {
        bgColor: '#059669', 
        textColor: '#ffffff',
        texts: ["المرحلة الخامسة", "تغيير المتغيرات"],
    },
    review: {
        bgColor: '#ffff00',
        textColor: '#000000',
        texts: ["المرحلة الثامنة", "مراجعة البطاقات"],
    },
    chat: { 
        bgColor: '#6c757d',
        textColor: '#ffffff',
        texts: ["المرحلة السادسة", "مرحلة كشف الحقيقة", "(المحادثة)"],
    }
};

interface StageSeparatorProps {
    stageId: string;
}

const StageSeparator: React.FC<StageSeparatorProps> = ({ stageId }) => {
    const config = STAGE_CONFIG[stageId] || STAGE_CONFIG.chat;

    const textShadow = `
        -1.5px -1.5px 0 #000,  
         1.5px -1.5px 0 #000,
        -1.5px  1.5px 0 #000,
         1.5px  1.5px 0 #000,
        -1.5px 0 0 #000,
         1.5px 0 0 #000,
         0 -1.5px 0 #000,
         0  1.5px 0 #000
    `;

    return (
        <div
            className="w-full max-w-sm mx-auto mb-4 rounded-lg shadow-lg p-6 flex flex-col justify-center items-center"
            style={{ backgroundColor: config.bgColor }}
        >
            {config.texts.map((text, index) => (
                <p
                    key={index}
                    className="text-3xl font-bold text-center leading-tight"
                    style={{
                        color: config.textColor,
                        textShadow: textShadow
                    }}
                >
                    {text}
                </p>
            ))}
        </div>
    );
};

export default StageSeparator;

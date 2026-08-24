import React from 'react';
import { motion } from 'motion/react';
import { Headphones, BookOpen, Axe, ShieldAlert, MessageCircle, Radio } from 'lucide-react';

interface MissionCoverProps {
    stageId: string;
    onStart: () => void;
    onSkip?: () => void;
}

export default function MissionCover({ stageId, onStart, onSkip }: MissionCoverProps) {
    let title = "";
    let icon = <BookOpen className="w-12 h-12 text-amber-900" />;
    let ellieText = "";
    let buttonText = "ابدأ المهمة ←";

    switch (stageId) {
        case 'story':
            title = "الغريب في سوق القرية";
            icon = <Headphones className="w-12 h-12 text-amber-900" />;
            ellieText = "انظر إليه... ينام كأنه سلطان القرية! السوق يستيقظ منذ الفجر، ونحن لم نشترِ شيئاً بعد. ساعده على الاستيقاظ... أنا لا أجرؤ، شخيره يخيف الدجاج!\n\nمهمتك الأولى: استمع جيداً لكل ما يقال في السوق. قد تحتاج هذه الكلمات لاحقاً... لا أقول لك لماذا. ولكن ثق بي.";
            break;
        case 'review':
            title = "يوميات إيلي";
            icon = <BookOpen className="w-12 h-12 text-amber-900" />;
            ellieText = "السوق مزدحم اليوم. الكل سيكون هناك: فينسنت، مارثا، غاستون... وبما أن ليث جديد، سيطرحون مليون سؤال.\n\nتعال. اقرأ معي ما حدث ودونه في يومياتي. هذا يساعدني على التذكر. وسيساعدك أنت أيضاً. من يدري متى ستحتاج هذه الكلمات في الغابة...";
            buttonText = "لنقرأ معاً ←";
            break;
        case 'memory':
            title = "الاحتطاب ومبارزة العفاريت";
            icon = <Axe className="w-12 h-12 text-amber-900" />;
            ellieText = "السياج! نسينا السياج! جزء منه مكسور... إذا جاء بركلز الليلة... سيأكل الدجاج مثل وجبة خفيفة!\n\nعلينا الذهاب إلى الغابة ونحتطب، لكن احذر... في الغابة يسكن المزاحون (العفاريت الزرق). إذا سمعوا كلمة خطأ سيضحكون علينا طوال الليل. هل تذكرت ما تعلمناه اليوم؟ استخدمه لتقطع الخشب وتطردهم!";
            buttonText = "إلى الغابة! ←";
            break;
        case 'textChat':
        case 'chat':
            title = "نجوم ودردشة حول النار";
            icon = <MessageCircle className="w-12 h-12 text-amber-900" />;
            ellieText = "الليالي هنا باردة... لكنها جميلة. بعد أن طردنا الوحش، نحتاج لبعض الراحة.\n\nتعال، اجلس قرب النار. أخبرني... كيف كان يومك حقاً؟ لا تخجل. أنا فقط أريد أن أسمع قصتك. بصوتك.";
            buttonText = "لنتحدث معاً ←";
            break;
        case 'radio':
            title = "محطة الوادي المضحك";
            icon = <Radio className="w-12 h-12 text-amber-900" />;
            ellieText = "أوه! كدت أنسى! الراديو! خالد وسارة يتحدثان الليلة. سمعت أنهما يتكلمان عن... عنا!\n\nكل القرية تعرف! فينسنت يتكلم أكثر من الراديو نفسه! تعال بسرعة، ربما يضحكون علينا... أو يمدحوننا! اسمع...";
            buttonText = "لنستمع! ←";
            break;
        default:
            title = "مهمة جديدة";
            ellieText = "يا بطل! نحن بحاجة إليك. لدينا مهام اليوم، أكملها لتحمي قريتنا!";
    }

    return (
        <div className="absolute inset-0 bg-amber-50/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6" dir="rtl">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-amber-200"
            >
                <div className="bg-amber-100/50 p-8 flex flex-col items-center text-center border-b border-amber-100 relative">
                    {onSkip && (
                        <button onClick={onSkip} className="absolute top-4 left-4 text-amber-700/50 hover:text-amber-700 text-sm font-medium underline">
                            تخطي
                        </button>
                    )}
                    <div className="bg-white p-4 rounded-full shadow-inner mb-4">
                        {icon}
                    </div>
                    <h2 className="text-3xl font-black text-amber-900 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                        {title}
                    </h2>
                </div>
                
                <div className="p-8 flex gap-6">
                    <div className="w-20 h-20 shrink-0 bg-amber-200 rounded-full border-4 border-white shadow-md overflow-hidden relative mt-2">
                        {/* Ellie Avatar Placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center text-amber-700 text-2xl font-black">إيلي</div>
                    </div>
                    <div>
                        <div className="bg-amber-50 rounded-2xl p-4 text-amber-900 leading-relaxed font-medium shadow-sm relative text-lg">
                            {/* Speech bubble tail */}
                            <div className="absolute right-[-10px] top-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[10px] border-l-amber-50"></div>
                            {ellieText.split('\n\n').map((para, idx) => (
                                <p key={idx} className={idx > 0 ? "mt-4" : ""}>{para}</p>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0">
                    <button 
                        onClick={onStart}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                    >
                        {buttonText}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

import React, { useState } from 'react';
import { useGameStore } from '../../game/store';

export default function StoryIntro() {
  const closeIntro = useGameStore((s) => s.closeIntro);
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '👑 البدايات الدافئة وصداقة الطفولة',
      arText: 'تبدأ القصة في قصرك العربي العظيم، حيث ولدت كأمير شجاع محاط بالدفء، تنطق كلماتك الأولى "بابا" و"ماما" بلسان عربي مبين. في نفس الوقت، ولد "ضرغام"، طفل يتيم وغني في نفس عمرك. كبرتما معاً كأصدقاء طفولة، ولكن الناس لم يكونوا يحبون ضرغام، فبدأ الحسد والبغض يتسلل إلى قلبه تجاهك، رغم أنك لم تراه سوى أخ لك.',
      visual: '👶🏰🤝',
      bgClass: 'bg-gradient-to-b from-blue-900/60 to-emerald-950/80',
    },
    {
      title: '🩸 الخيانة في ربيع الشباب',
      arText: 'مرت الأيام سريعاً حتى بلغت العشرين من عمرك وأصبحت ملكاً. لكن في ليلة مظلمة، انفجر حقد "ضرغام" الذي أصبح وزيرك، فقام بخيانتك والانقلاب عليك، مستغلاً طيبة قلبك ليحرق قصرك ويسلب عرشك. لم يقتلك، بل نفاك بعيداً جداً إلى أرض غريبة، مجرداً من كل شيء.',
      visual: '👑🔥🗡️',
      bgClass: 'bg-gradient-to-b from-emerald-950/80 to-red-950/80',
    },
    {
      title: '🏚️ أرض الغرباء ولغة مجهولة',
      arText: 'وجدت نفسك وحيداً في مكان مجهول حيث الناس لا يتحدثون العربية أبداً بل الإنجليزية. كنت تائهاً في الشوارع، لا تفهم حرفاً مما يقولون. أدركت حينها أن النجاة واستعادة مجدك يتطلب منك تعلم لغتهم، التقاط الكلمات من أفواههم في الشوارع كما فعل الصحابي زيد، نقطة بنقطة، لتصبح واحداً منهم.',
      visual: '🚶‍♂️🌫️🗣️',
      bgClass: 'bg-gradient-to-b from-red-950/80 to-stone-900/90',
    },
    {
      title: '🌱 رفيقة الدرب وبناء الأمل',
      arText: 'في أشد لحظات يأسك، التقيت بفتاة محلية طيبة القلب، ساعدتك وبدأت تعلمك كلماتهم يوماً بعد يوم. ستصبح هذه الفتاة زوجتك وشريكة كفاحك. ومن هنا، تبدأ رحلتك من الصفر.. تبني قريتك، تتعلم اللغة الإنجليزية من المستوى A1 حتى تتقنها، لتجمع جيشك وتعود لاسترداد عرشك من الخائن ضرغام!',
      visual: '🌱👩‍🏫⚔️',
      bgClass: 'bg-gradient-to-b from-stone-900/90 to-amber-950/90',
    }
  ];

  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      closeIntro();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-white text-center transition-all duration-700 ${current.bgClass}`}>
      {/* Cottagecore Parchment styled modal wrapper */}
      <div className="w-full max-w-md bg-[#5C3D2E]/95 border-4 border-[#C4603A] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[480px]">
        {/* Background visual detail */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#F5E6C8]/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#C4603A]/20 rounded-full blur-xl pointer-events-none" />

        {/* Skip button */}
        <button 
          onClick={closeIntro}
          className="self-end text-xs text-[#F5E6C8]/60 hover:text-white underline"
        >
          تخطي العرض ➜
        </button>

        {/* Visual Emoticon / Graphic */}
        <div className="my-6 text-6xl animate-bounce filter drop-shadow">
          {current.visual}
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold text-[#F5E6C8] border-b border-[#C4603A]/40 pb-2">
            {current.title}
          </h2>
          
          {/* Narrative Text */}
          <p className="text-sm md:text-base text-[#F5E6C8]/90 leading-relaxed text-justify px-2" dir="rtl">
            {current.arText}
          </p>
        </div>

        {/* Dots progress indicator */}
        <div className="flex justify-center gap-1.5 mt-6">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${idx === step ? 'w-6 bg-[#C4603A]' : 'w-2 bg-stone-500'}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-[#C4603A] to-[#8FAF7E] hover:from-[#d16f49] hover:to-[#a0c28f] text-[#FDF6E3] font-bold rounded-xl border-b-4 border-[#5C3D2E] active:border-b-0 transition-all text-base filter drop-shadow-md"
        >
          {step === steps.length - 1 ? 'ابتدئ رحلة استعادة العرش ⚔️' : 'التالي ➔'}
        </button>
      </div>
    </div>
  );
}

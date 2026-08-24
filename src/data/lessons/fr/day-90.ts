import type { Lesson } from "../types";

// Source: Legacy "90 يوم" app — 90.html (day 90).
const lesson: Lesson = {
  day: 90,
  lang: "fr",
  cefr: "B2",
  storyArc: "standalone",
  title: "اليوم 90 — تقييم الرحلة والتخطيط للمستقبل (فرنسي)",
  dialogue: [
    {
      character: "Camille",
      native: "Fatima, nous avons atteint le Jour 90! Comment te sens-tu concernant ton parcours d'apprentissage du français?",
      pronunciation: "فاتيما, نو زافون زاتّانّت لو جورّ ناڤانّت! كومون تو سّونس تو كونسّيرّنان طون پّارّكورّ دابّرانتيساج دو فّرّانسّيه؟",
      translation: "فاطمة، لقد وصلنا إلى اليوم التسعين! كيف تشعرين حيال رحلتكِ في تعلم الفرنسية؟",
      tier: "core",
    },
    {
      character: "Fatima",
      native: "C'est incroyable, Camille. Je n'arrive pas à croire les progrès que j'ai faits. Ma fluidité s'est améliorée à pas de géant.",
      pronunciation: "سّيه تانّكرّوايابل, كاميي. جو نارّيڤ پّا زآ كرّوايرّ ليه پّروغغيه كو جيه فّايت. ما فّلّويديتيه سّيست أميلّيورّيه زآ پّا دو جِيّانّت.",
      translation: "إنه أمر لا يصدق يا كاميل. لا أستطيع أن أصدق التقدم الذي أحرزته. لقد تحسنت طلاقتي بخطوات عملاقة.",
      tier: "medium",
    },
    {
      character: "Camille",
      native: "C'est fantastique à entendre! Quel a été l'aspect le plus difficile pour toi?",
      pronunciation: "سّيه فّانتاسّتيك آ زانّتاندرّ! كيل آ إيتيه لّاسّپّيكت لو پّلو ديفّيسيل پّورّ توا؟",
      translation: "هذا رائع أن أسمع! ما هو الجانب الأكثر تحدياً بالنسبة لكِ؟",
      tier: "core",
    },
    {
      character: "Fatima",
      native: "Honnêtement, surmonter la peur de faire des erreurs a été difficile. Mais pratiquer quotidiennement m'a aidée à franchir cette barrière.",
      pronunciation: "أونّيتمون, سّورّمونتيه لا پّورّ دو فّيرّ ديه زيرّرّورّ آ إيتيه ديفّيسيل. ميه پّرّاتيكيه كوتيدِيّانّومون ما زاديه آ فّرانّشيرّ سّيت بّارّرّيغ.",
      translation: "بصراحة، التغلب على خوف ارتكاب الأخطاء كان صعباً. لكن الممارسة اليومية ساعدتني على تجاوز هذا الحاجز.",
      tier: "secondary",
    },
    {
      character: "Camille",
      native: "La persévérance est la clé. Quelle partie de la langue te sens-tu maintenant la plus à l'aise d'utiliser?",
      pronunciation: "لا پّيرسّيڤيرّانسّ إيه لا كليه. كيل پّارّتي دو لا لّانغ تو سّونس-تو مانتنان لا پّلو زآ لّايس دوتيليزيه؟",
      translation: "المثابرة هي المفتاح. أي جزء من اللغة تشعرين الآن بالراحة الأكبر في استخدامه؟",
      tier: "medium",
    },
    {
      character: "Fatima",
      native: "Définitivement les conversations quotidiennes et l'expression d'opinions. Je peux me défendre maintenant.",
      pronunciation: "ديفّينيتيفّمون ليه كونسّيرّڤاسّيون كوتيدِيّان إيه ليكسّپّريسّيون دّوبّينيون. جو پو مو ديفّاندرّ مانتنان.",
      translation: "بالتأكيد المحادثات اليومية والتعبير عن الآراء. أستطيع أن أدافع عن نفسي الآن.",
      tier: "core",
    },
    {
      character: "Camille",
      native: "Excellent! Quelles sont tes prochaines étapes? Comment comptes-tu maintenir cet élan?",
      pronunciation: "إكسيلّون! كيل سّون تيه پّروشّين زيتآپّ؟ كومون كونت-تو مانتّينير سّيت إيلانّ؟",
      translation: "ممتاز! ما هي خطواتكِ التالية؟ كيف تخططين للحفاظ على هذا الزخم؟",
      tier: "medium",
    },
    {
      character: "Fatima",
      native: "Je me concentrerai sur la lecture de littérature plus avancée et l'engagement avec des locuteurs natifs en ligne. Je veux aussi approfondir les expressions idiomatiques.",
      pronunciation: "جو مو كونسّانترّيرّاي سّورّ لا لّيكتّورّ دو لّيتِرّاتورّ پّلو زافّانسّيه إيه لّانّگاجومون أڤيك ديه لّوكّوتورّ ناتيڤ زون لين. جو ڤو زو سّي أبّپّروفّونّديغ ليه زيكسّپّريسّيون زيدِيّوماتيك.",
      translation: "سأركز على قراءة المزيد من الأدب المتقدم والتفاعل مع المتحدثين الأصليين عبر الإنترنت. أريد أيضاً أن أتعمق أكثر في التعابير الاصطلاحية.",
      tier: "secondary",
    },
    {
      character: "Camille",
      native: "Ça ressemble à un plan solide pour une vraie maîtrise. Des réflexions finales sur ce programme?",
      pronunciation: "سا رّوسّمبل آ تان پّلان سّوليد پّورّ أون ڤرّاي مايتْرّيز. ديه رّيفليكسّيون فّينال سّورّ سّو پّروغرّامّ؟",
      translation: "تبدو خطة قوية لإتقان حقيقي. أي أفكار أخيرة حول هذا البرنامج؟",
      tier: "medium",
    },
    {
      character: "Fatima",
      native: "Ce fut un tournant. Les dialogues structurés et la pratique quotidienne ont été exactement ce dont j'avais besoin pour passer de zéro à héros.",
      pronunciation: "سّو فّوت آن تورّنّان. ليه دِيالوغ سّترّوكّتورّيه زيه لا پّرّاتيك كوتيدِيّانّ أو زون إيتيه إيغزاكتومون سّو دون جافّيه بّوزوان پّورّ پّاسّيه دو زيرو آ إيرو.",
      translation: "لقد كان نقطة تحول. الحوارات المنظمة والممارسة اليومية كانت بالضبط ما احتجته للانتقال من الصفر إلى البطولة.",
      tier: "secondary",
    },
  ],
};

export default lesson;

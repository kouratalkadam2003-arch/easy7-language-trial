import type { Lesson } from "../types";

// Source: Legacy "90 يوم" app — 90.html (day 90).
const lesson: Lesson = {
  day: 90,
  lang: "it",
  cefr: "B2",
  storyArc: "standalone",
  title: "اليوم 90 — تقييم الرحلة والتخطيط للمستقبل (إيطالي)",
  dialogue: [
    {
      character: "Luca",
      native: "Sami, siamo arrivati al giorno 90! Come ti senti riguardo al tuo percorso di apprendimento dell'italiano?",
      pronunciation: "سامي, سّيامو أرّيڤاتي آل جورنو نونانتّا! كومه تي سّينتي رّيغواردو آل توو پّيرّكورّسّو دي أبّپْرِنديمينتو ديلّيتاليانو؟",
      translation: "سامي، لقد وصلنا إلى اليوم التسعين! كيف تشعر حيال رحلتك في تعلم الإيطالية؟",
      tier: "core",
    },
    {
      character: "Sami",
      native: "È incredibile, Luca. Non riesco a credere quanti progressi ho fatto. La mia fluidità è migliorata a passi da gigante.",
      pronunciation: "إيه إنكريديبّيلِه, لوكا. نون رّييسّكو آ كرّيديرّه كوانتي پّروگرّيسّي أو فّاتّو. لا ميا فّلّويديتا إيه ميليورّاتا آ پّاسّي دا جّيغانّتِه.",
      translation: "إنه أمر لا يصدق يا لوكا. لا أستطيع أن أصدق كم التقدم الذي أحرزته. لقد تحسنت طلاقتي بخطوات عملاقة.",
      tier: "medium",
    },
    {
      character: "Luca",
      native: "È fantastico sentirlo! Qual è stato l'aspetto più impegnativo per te?",
      pronunciation: "إيه فّانتاسّتيكو سّينتيرّلو! كوال إيه سّتاتو لّاسّپّيتّو پّيو إيمپّينياتيڤو پّيرّ تيه؟",
      translation: "هذا رائع أن أسمع! ما هو الجانب الأكثر تحدياً بالنسبة لك؟",
      tier: "core",
    },
    {
      character: "Sami",
      native: "Onestamente, superare la paura di fare errori è stato difficile. Ma praticare ogni giorno mi ha aiutato a superare quella barriera.",
      pronunciation: "أونيستامينتيه, سّوپيرّارِه لا پّاورا دي فّارِه إيرّرّورّي إيه سّتاتو ديفّفّيتشيلِه. ما پّرّاتيكارّه أونيي جّورّنو مي آ أيوتاتو آ سّوپيرّارِه كويلّا بّارّرّييرّا.",
      translation: "بصراحة، التغلب على خوف ارتكاب الأخطاء كان صعباً. لكن الممارسة اليومية ساعدتني على تجاوز هذا الحاجز.",
      tier: "secondary",
    },
    {
      character: "Luca",
      native: "La perseveranza è fondamentale. Quale parte della lingua ti senti ora più sicuro di usare?",
      pronunciation: "لا پّيرسّيڤيرّانزا إيه فّونّدامينتالِه. كواله پّارّته ديلّا لّينغوا تي سّينتي أورا پّيو سّيكورو دي أوزارِه؟",
      translation: "المثابرة هي المفتاح. أي جزء من اللغة تشعر الآن بالثقة الأكبر في استخدامه؟",
      tier: "medium",
    },
    {
      character: "Sami",
      native: "Decisamente le conversazioni quotidiane e l'espressione di opinioni. Ora posso farmi valere.",
      pronunciation: "ديتشيسّامينتيه لّيه كونتْشيرّساتسيوني كوتّيدِيّانِه إه لّيسّپّريسّيونِه دي أوپينيوني. أورا پّوسّو فّارّمي ڤالّيرّه.",
      translation: "بالتأكيد المحادثات اليومية والتعبير عن الآراء. أستطيع أن أدافع عن رأيي الآن.",
      tier: "core",
    },
    {
      character: "Luca",
      native: "Eccellente! Quali sono i tuoi prossimi passi? Come pensi di mantenere questo slancio?",
      pronunciation: "إيتشّيلّينتِه! كوالي سّونو إي تووي پروسّيمي پّاسّي؟ كومه پّينسي دي مانتّينيرّه كويستو سّلّانتشّيو؟",
      translation: "ممتاز! ما هي خطواتك التالية؟ كيف تخطط للحفاظ على هذا الزخم؟",
      tier: "medium",
    },
    {
      character: "Sami",
      native: "Mi concentrerò sulla lettura di letteratura più avanzata e sull'interazione con madrelingua online. Voglio anche approfondire gli idiomi.",
      pronunciation: "مي كونتْشينتْرّيرّو سّولّا لّيتّورّا دي لّيتِرّاتورّا پّيو أڤانزّاتا إه سّولّينتيرّاتسيونِه كون مادّيرّيلينغوا أونلاين. ڤولّيو أنكيه أبّپّروفّونّديرّه لّي إيدِيّومي.",
      translation: "سأركز على قراءة المزيد من الأدب المتقدم والتفاعل مع المتحدثين الأصليين عبر الإنترنت. أريد أيضاً أن أتعمق أكثر في التعابير الاصطلاحية.",
      tier: "secondary",
    },
    {
      character: "Luca",
      native: "Sembra un piano solido per una vera padronanza. Qualche pensiero finale su questo programma?",
      pronunciation: "سيمبرا أون پّيانو سّوليدو پّير أونا ڤيرّا پّادرّونانزا. كوالكيه پّينسّييرو فّينالِه سّو كويستو پّروگرّامّا؟",
      translation: "تبدو خطة قوية لإتقان حقيقي. أي أفكار أخيرة حول هذا البرنامج؟",
      tier: "medium",
    },
    {
      character: "Sami",
      native: "È stato un punto di svolta. I dialoghi strutturati e la pratica quotidiana erano esattamente ciò di cui avevo bisogno per passare da zero a eroe.",
      pronunciation: "إيه سّتاتو أون پّونتو دي سّڤولتا. إي دِيالوغي سّترّوتّتورّاتي إه لا پّرّاتيكا كوتّيديانا إيرّانو إزاتّامينتيه تشّو دي كوي أڤيڤو بيزونيو پّير پّاسّارّه دا زيرو آ إيرّوِه.",
      translation: "لقد كان نقطة تحول. الحوارات المنظمة والممارسة اليومية كانت بالضبط ما احتجته للانتقال من الصفر إلى البطولة.",
      tier: "secondary",
    },
  ],
};

export default lesson;

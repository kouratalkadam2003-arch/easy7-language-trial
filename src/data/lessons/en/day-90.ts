import type { Lesson } from "../types";

// Source: Legacy "90 يوم" app — 90.html (day 90, English track: John & Ahmed).
// Tiering heuristic (auto): shortest = core, mid = medium, longest reflective = secondary.
const lesson: Lesson = {
  day: 90,
  lang: "en",
  cefr: "B2",
  storyArc: "standalone",
  title: "اليوم 90 — تقييم الرحلة والتخطيط للمستقبل",
  dialogue: [
    {
      character: "John",
      native: "Ahmed, we've reached Day 90! How do you feel about your journey learning English?",
      pronunciation: "أحمد, ويڤ ريتشد داي ناينتي! هاو دو يو فيل أباوت يور جيرني ليرنينغ إنجليش؟",
      translation: "أحمد، لقد وصلنا إلى اليوم التسعين! كيف تشعر حيال رحلتك في تعلم الإنجليزية؟",
      tier: "core",
    },
    {
      character: "Ahmed",
      native: "It's incredible, John. I can't believe how much progress I've made. My fluency has improved by leaps and bounds.",
      pronunciation: "إتس إنكريدبل, جون. آي كانت بيليڤ هاو ماتش پروجرس آيڤ ميد. ماي فّلوينسِي هاز إمبروڤد باي ليبس آند باوندز.",
      translation: "إنه أمر لا يصدق يا جون. لا أصدق كم التقدم الذي أحرزته. لقد تحسنت طلاقتي بشكل كبير وسريع.",
      tier: "medium",
    },
    {
      character: "John",
      native: "That's fantastic to hear! What was the most challenging aspect for you?",
      pronunciation: "ذاتس فّانّتاسّتيك تو هير! وات واز ذا موست تشالِنجنغ أسبكت فور يو؟",
      translation: "هذا رائع أن أسمع! ما هو الجانب الأكثر تحدياً بالنسبة لك؟",
      tier: "core",
    },
    {
      character: "Ahmed",
      native: "Honestly, getting over the fear of making mistakes was tough. But practicing daily helped me break through that barrier.",
      pronunciation: "أونستلي, غيتنغ أوفر ذا فير أوف ميكنغ مستيكس واز طف. بات پرّاكّتِسنغ دايلي هيلبد مي بريك ثرو ذات بارّيَرّ.",
      translation: "بصراحة، التغلب على خوف ارتكاب الأخطاء كان صعباً. لكن الممارسة اليومية ساعدتني على اختراق هذا الحاجز.",
      tier: "secondary",
    },
    {
      character: "John",
      native: "Perseverance is key. What part of the language do you now feel most confident using?",
      pronunciation: "پّيرّسّيڤيرّنس إز كي. وات پّارت أوف ذا لانجوج دو يو ناو فيل موست كونفِدنت يوزنغ؟",
      translation: "المثابرة هي المفتاح. أي جزء من اللغة تشعر الآن بالثقة الأكبر في استخدامه؟",
      tier: "medium",
    },
    {
      character: "Ahmed",
      native: "Definitely everyday conversations and expressing opinions. I can hold my own now.",
      pronunciation: "ديفينيتلي إفري-داي كونسّرفّاشنز آند إكسپّرسنغ أوپّينيونز. آي كان هولد ماي أون ناو.",
      translation: "بالتأكيد المحادثات اليومية والتعبير عن الآراء. أستطيع أن أدافع عن رأيي الآن.",
      tier: "core",
    },
    {
      character: "John",
      native: "Excellent! What are your next steps? How do you plan to keep this momentum going?",
      pronunciation: "إكسلنت! وات آر يور نكست ستيبس؟ هاو دو يو بلان تو كيب ذيس مومِنتَم غوينغ؟",
      translation: "ممتاز! ما هي خطواتك التالية؟ كيف تخطط للحفاظ على هذا الزخم؟",
      tier: "medium",
    },
    {
      character: "Ahmed",
      native: "I'll focus on reading more advanced literature and engaging with native speakers online. I also want to dive deeper into idioms.",
      pronunciation: "آيل فّوكس أون ريدنغ مور أدفانسد لتِرّاتشِر آند إن-غَيجينغ ويث نيتِڤ سّبّيكرز أونلاين. آي أولسو وونت تو دايف ديبّرّ إنتو إيدِيَمز.",
      translation: "سأركز على قراءة المزيد من الأدب المتقدم والتفاعل مع المتحدثين الأصليين عبر الإنترنت. أريد أيضاً أن أتعمق أكثر في التعابير الاصطلاحية.",
      tier: "secondary",
    },
    {
      character: "John",
      native: "Sounds like a solid plan for true mastery. Any final thoughts on this program?",
      pronunciation: "ساوندز لايك أ سّوليد بلان فور ترّو ماستري. إني فّاينل ثوتس أون ذيس پرّوغرام؟",
      translation: "تبدو خطة قوية لإتقان حقيقي. أي أفكار أخيرة حول هذا البرنامج؟",
      tier: "medium",
    },
    {
      character: "Ahmed",
      native: "It was a game-changer. The structured dialogues and daily practice were exactly what I needed to get from zero to hero.",
      pronunciation: "إت واز أ غيم-تشينجرّ. ذا سّترّاكّتشرّد دايالوجز آند دايلي پرّاكّتِس وير إيغزاكتلي وات آي نيدد تو غيت فروم زيرو تو هيرو.",
      translation: "لقد كان نقطة تحول. الحوارات المنظمة والممارسة اليومية كانت بالضبط ما احتجته للانتقال من الصفر إلى البطولة.",
      tier: "secondary",
    },
  ],
};

export default lesson;

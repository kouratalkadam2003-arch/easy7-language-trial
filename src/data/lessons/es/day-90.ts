import type { Lesson } from "../types";

// Source: Legacy "90 يوم" app — 90.html (day 90).
const lesson: Lesson = {
  day: 90,
  lang: "es",
  cefr: "B2",
  storyArc: "standalone",
  title: "اليوم 90 — تقييم الرحلة والتخطيط للمستقبل (إسباني)",
  dialogue: [
    {
      character: "Sofia",
      native: "Omar, ¡hemos llegado al Día 90! ¿Cómo te sientes acerca de tu viaje aprendiendo español?",
      pronunciation: "عمر, إيموس لّيغادو آل ديا نوفيّنتا! كومو تيه سّيينتيس أثيرّكا ديه تو ڤياخيه أپرّيندييندو إسّپّانيول؟",
      translation: "عمر، لقد وصلنا إلى اليوم التسعين! كيف تشعر حيال رحلتك في تعلم الإسبانية؟",
      tier: "core",
    },
    {
      character: "Omar",
      native: "Es increíble, Sofía. No puedo creer cuánto progreso he hecho. Mi fluidez ha mejorado a pasos agigantados.",
      pronunciation: "إس إنكرّيبليه, صوفيا. نو بّويدو كرّيهير كوانتو پّروغرّيسّو إيه إيتشو. مي فّلّويديث آ ميهورّادو آ پّاسّوس أغيغانتادوس.",
      translation: "إنه أمر لا يصدق يا صوفيا. لا أصدق كم التقدم الذي أحرزته. لقد تحسنت طلاقتي بشكل كبير وسريع.",
      tier: "medium",
    },
    {
      character: "Sofia",
      native: "¡Es fantástico escuchar eso! ¿Cuál fue el aspecto más desafiante para ti?",
      pronunciation: "إس فّانّتاسّتيكو إسّكوتشار إيسو! كوال فوي إل أسّپّيكتو ماس ديسافيانّتيه بارا تي؟",
      translation: "هذا رائع أن أسمع! ما هو الجانب الأكثر تحدياً بالنسبة لك؟",
      tier: "core",
    },
    {
      character: "Omar",
      native: "Honestamente, superar el miedo a cometer errores fue difícil. Pero practicar a diario me ayudó a romper esa barrera.",
      pronunciation: "أونيستامينتيه, سّوپيرّار إل مييدو آ كوميتيرّ إيرّورّيس فوي ديفّيثيل. بّيرّو پّرّاكّتيكارّ آ دِياريو ميه أيودو آ رّومپّيرّ إيسا بّارّرّيرّا.",
      translation: "بصراحة، التغلب على خوف ارتكاب الأخطاء كان صعباً. لكن الممارسة اليومية ساعدتني على كسر هذا الحاجز.",
      tier: "secondary",
    },
    {
      character: "Sofia",
      native: "La perseverancia es clave. ¿Qué parte del idioma te sientes ahora más seguro de usar?",
      pronunciation: "لا پّيرسّيڤيرّانثيا إس كلابيه. كيه پّارته ديل إيدِيّوما تيه سّيينتيس آؤورا ماس سّيغورو ديه أوسّارّ؟",
      translation: "المثابرة هي المفتاح. أي جزء من اللغة تشعرين الآن بالثقة الأكبر في استخدامه؟",
      tier: "medium",
    },
    {
      character: "Omar",
      native: "Definitivamente las conversaciones cotidianas y expresar opiniones. Ahora puedo defenderme.",
      pronunciation: "ديفينيتامينتيه لاس كونسّيرّڤاثيونيس كوتّيدِيّاناس إي إكسپّريسّار أوپينيونيس. آؤورا پّويدو ديفّيندرّمه.",
      translation: "بالتأكيد المحادثات اليومية والتعبير عن الآراء. أستطيع أن أدافع عن نفسي الآن.",
      tier: "core",
    },
    {
      character: "Sofia",
      native: "¡Excelente! ¿Cuáles son tus próximos pasos? ¿Cómo planeas mantener este impulso?",
      pronunciation: "إكسيلّينتيه! كواليس سّون توس پّروكسيموس پّاسّوس؟ كومو پّلانّياس مانتينير إيسّتيه إيمپّولسّو؟",
      translation: "ممتاز! ما هي خطواتكِ التالية؟ كيف تخططين للحفاظ على هذا الزخم؟",
      tier: "medium",
    },
    {
      character: "Omar",
      native: "Me centraré en leer literatura más avanzada y interactuar con hablantes nativos en línea. También quiero profundizar en las expresiones idiomáticas.",
      pronunciation: "ميه ثينترّاريه إن لّيه إيرّ لّيتِرّاتورّا ماس أڤانثادا إي إينتيرّاكّتوارّ كون أبلّانّتيس ناتيڤوس إن لّينييا. تامبيين كييرو پّروفّونديثار إن لاس إكسپّريسّيونيس إيدِيّوماتيكاس.",
      translation: "سأركز على قراءة المزيد من الأدب المتقدم والتفاعل مع المتحدثين الأصليين عبر الإنترنت. أريد أيضاً أن أتعمق أكثر في التعابير الاصطلاحية.",
      tier: "secondary",
    },
    {
      character: "Sofia",
      native: "Parece un plan sólido para una verdadera maestría. ¿Alguna reflexión final sobre este programa?",
      pronunciation: "بّاريثيه أون پّلان سّوليدو بارا أونا ڤيرّداديرّا مايسّتْرّيا. ألغونا رّيفّليكسّيون فّينال سّوبريه إيسّتيه پّروغرامّا؟",
      translation: "تبدو خطة قوية لإتقان حقيقي. أي أفكار أخيرة حول هذا البرنامج؟",
      tier: "medium",
    },
    {
      character: "Omar",
      native: "Fue un cambio de juego. Los diálogos estructurados y la práctica diaria fueron exactamente lo que necesitaba para pasar de cero a héroe.",
      pronunciation: "فوي أون كامبيو ديه خويغو. لوس دِيالوغوس إسّترّوكّتورّادوس إي لا پّرّاكّتيكا دِياريا فّويّرون إكساكتامينتيه لو كيه نيثيسّيتابا بارا پّاسّارّ ديه ثيرو آ إيرّو.",
      translation: "لقد كان نقطة تحول. الحوارات المنظمة والممارسة اليومية كانت بالضبط ما احتجته للانتقال من الصفر إلى البطولة.",
      tier: "secondary",
    },
  ],
};

export default lesson;

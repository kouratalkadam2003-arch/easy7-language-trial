import type { Lesson } from "../types";

// Source: Legacy "90 يوم" app — 90.html (day 90).
const lesson: Lesson = {
  day: 90,
  lang: "de",
  cefr: "B2",
  storyArc: "standalone",
  title: "اليوم 90 — تقييم الرحلة والتخطيط للمستقبل (ألماني)",
  dialogue: [
    {
      character: "Lukas",
      native: "Ali, wir haben Tag 90 erreicht! Wie fühlst du dich auf deiner Reise, Deutsch zu lernen?",
      pronunciation: "علي, ڤيرّ هابّن تاغ نونتسيغ إرّايشت! ڤي فولّست دو ديش آوفّ داينرّ رّايزه, دويتش تسو ليرّنن؟",
      translation: "علي، لقد وصلنا إلى اليوم التسعين! كيف تشعر حيال رحلتك في تعلم الألمانية؟",
      tier: "core",
    },
    {
      character: "Ali",
      native: "Es ist unglaublich, Lukas. Ich kann kaum glauben, wie viel Fortschritt ich gemacht habe. Meine Sprachkenntnisse haben sich sprunghaft verbessert.",
      pronunciation: "إس إست أونّ-غلآوبليش, لوكاس. إيش كان كا وم غلاوبّن, ڤي فيل فّورّت-شترّيت إيش غيماخت هابّه. ماينه شْبّرّاخ-كينّنتنيسّي هابّن زّيش شّپّرّونّفّ-هافّت بّي-فّيرّبّيسّرّت.",
      translation: "إنه أمر لا يصدق يا لوكاس. لا أصدق كم التقدم الذي أحرزته. لقد تحسنت طلاقتي بشكل كبير وسريع.",
      tier: "medium",
    },
    {
      character: "Lukas",
      native: "Das ist fantastisch zu hören! Was war der schwierigste Aspekt für dich?",
      pronunciation: "داس إست فّانّتاسّتيك تسو هورّن! ڤاس ڤارّ ديرّ شّڤيريغستّه أسّپّيكت فّورّ ديش؟",
      translation: "هذا رائع أن أسمع! ما هو الجانب الأكثر تحدياً بالنسبة لك؟",
      tier: "core",
    },
    {
      character: "Ali",
      native: "Ehrlich gesagt, die Angst vor Fehlern zu überwinden war hart. Aber tägliches Üben half mir, diese Barriere zu durchbrechen.",
      pronunciation: "إيرّلّيش غيزاغت, دي آنغست فّورّ فّيلرّن تسو أوبيرّـڤيندّن ڤارّ هارت. آبرّ تيغليشّس أوبّن هالفّ ميرّ, ديزه بّارّرّيرّه تسو دّورّشّبرّيشن.",
      translation: "بصراحة، التغلب على خوف ارتكاب الأخطاء كان صعباً. لكن الممارسة اليومية ساعدتني على اختراق هذا الحاجز.",
      tier: "secondary",
    },
    {
      character: "Lukas",
      native: "Ausdauer ist der Schlüssel. Welchen Teil der Sprache fühlst du dich jetzt am sichersten zu verwenden?",
      pronunciation: "آوسّ-دّاوّرّ إست ديرّ شلّوسّل. ڤيلشن تايل ديرّ شّپّرّاخِه فولّست دو ديش يتست آم زّيشرّستن تسو فّيرّڤيندّن؟",
      translation: "المثابرة هي المفتاح. أي جزء من اللغة تشعر الآن بالثقة الأكبر في استخدامه؟",
      tier: "medium",
    },
    {
      character: "Ali",
      native: "Definitiv alltägliche Gespräche und das Ausdrücken von Meinungen. Ich kann mich jetzt behaupten.",
      pronunciation: "ديفينيتيف آلّتّيغليشه غيشّپّريشه أوند داس آوسّدرّوكّن فّون ماينونگن. إيش كان ميش يتست بّي-هآوبّتن.",
      translation: "بالتأكيد المحادثات اليومية والتعبير عن الآراء. أستطيع أن أدافع عن رأيي الآن.",
      tier: "core",
    },
    {
      character: "Lukas",
      native: "Ausgezeichnet! Was sind deine nächsten Schritte? Wie planst du, diesen Schwung beizubehalten?",
      pronunciation: "آوسّ-غيتسايخنت! ڤاس زيند داينه نيكستن شريته؟ ڤي پّلانست دو, ديزن شّڤونغ بّايتسو-هالّتن؟",
      translation: "ممتاز! ما هي خطواتك التالية؟ كيف تخطط للحفاظ على هذا الزخم؟",
      tier: "medium",
    },
    {
      character: "Ali",
      native: "Ich werde mich auf das Lesen fortgeschrittener Literatur konzentrieren und online mit Muttersprachlern interagieren. Ich möchte auch tiefer in Redewendungen eintauchen.",
      pronunciation: "إيش ڤيرده ميش آوفّ داس لّيزن فّورّتّغيشّريتّنرّ لّيتِرّاتورّ كونسّينترّيرّن أوند أونلاين ميت موتّرّشّپّراخلرّ إينتيرّاجيرّن. إيش موشته آوخ تيفّرّ إن رّيدِه-ڤيندّونگن آين-تاوشن.",
      translation: "سأركز على قراءة المزيد من الأدب المتقدم والتفاعل مع المتحدثين الأصليين عبر الإنترنت. أريد أيضاً أن أتعمق أكثر في التعابير الاصطلاحية.",
      tier: "secondary",
    },
    {
      character: "Lukas",
      native: "Das klingt nach einem soliden Plan für wahre Meisterschaft. Irgendwelche letzten Gedanken zu diesem Programm?",
      pronunciation: "داس كلينغت ناخ آينم سّوليدن پّلان فّورّ ڤارّهِه مايسّترّشافت. إيرغند-ڤيلشه لّيتستن غيدانكن تسو ديزم پّروغرّامّ؟",
      translation: "تبدو خطة قوية لإتقان حقيقي. أي أفكار أخيرة حول هذا البرنامج؟",
      tier: "medium",
    },
    {
      character: "Ali",
      native: "Es war ein Wendepunkt. Die strukturierten Dialoge und das tägliche Üben waren genau das, was ich brauchte, um von Null zum Helden zu werden.",
      pronunciation: "إس ڤارّ آين ڤيندّيه-پّونكت. دي شتْرّوكّتورّيرّتن دِيالوغِه أوند داس تيغليشه أوبّن ڤارّن غيناو داس, ڤاس إيش براوختّه, أوم فّون نولّ تسوم هيلّدن تسو ڤيرّدن.",
      translation: "لقد كان نقطة تحول. الحوارات المنظمة والممارسة اليومية كانت بالضبط ما احتجته للانتقال من الصفر إلى البطولة.",
      tier: "secondary",
    },
  ],
};

export default lesson;

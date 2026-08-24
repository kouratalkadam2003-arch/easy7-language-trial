export interface Character {
  id: 'eli' | 'tom' | 'dirgham';
  name: string;
  nameAr: string;
  role: string;
  avatar: string;
  personality: string;
  greetings: string[];
  encouragements: string[];
  warnings: string[];
}

export const CHARACTERS: Record<string, Character> = {
  eli: {
    id: 'eli',
    name: 'Sarah',
    nameAr: 'إيلي (رفيقتك ومعلمتك)',
    role: 'المعلمة والرفيقة',
    avatar: '👩‍🏫',
    personality: 'دافئة ومحفّزة، تحب المبادرات التعليمية',
    greetings: [
      'أهلاً يا ليث! اليوم راح نتعلم كلمات جديدة!',
      'جاهز للتعلم؟ أنا متحمسة!',
      'يلا نبدأ الدرس الجديد!'
    ],
    encouragements: [
      'ممتاز يا ليث! تقدّم رهيب!',
      'أنت بطل! كمّل كذا!',
      'ما شاء الله! تعلّمت بسرعة!',
      'فخورة فيك يا ليث!'
    ],
    warnings: [
      'انتبه! البطاقات قربت تنسى!',
      'لازم تراجع Otherwise بتضيع!',
      'الوقت يجري يا ليث!'
    ]
  },
  tom: {
    id: 'tom',
    name: 'Tom',
    nameAr: 'توم (المحارب)',
    role: 'محارب القرية',
    avatar: '⚔️',
    personality: 'شجاع ومباشر، يركز على القتال والدفاع',
    greetings: [
      'مرحباً يا ليث! يلا للتدريب!',
      'العدو ما يستنى! خلنا نتدرب!',
      'القوة بالتمرين!'
    ],
    encouragements: [
      'قتال ممتاز يا ليث!',
      'أنت محارب حقيقي!',
      'الجيش يزداد قوة!'
    ],
    warnings: [
      'العدو يقترب! لازم تراجع!',
      'الدفاع ضعيف! كمّل!'
    ]
  },
  dirgham: {
    id: 'dirgham',
    name: 'Dirgham',
    nameAr: 'ضرغام (الخائن)',
    role: 'الخصم',
    avatar: '😡',
    personality: 'شرس ومتوحّش، يحاول إسقاط القرية',
    greetings: [
      'ههههه! وصلتك رسالتي يا ليث!',
      'قريتك في متناول يدي!',
      'ستندم على التوقف عن التعلم!'
    ],
    encouragements: [
      'لا تظن إنك بأمان!',
      'سأعود أقوى!'
    ],
    warnings: [
      'سأهدم قلاعك بالكامل!',
      'الوقت ضدي... لكن سأعود!'
    ]
  }
};

export type DialogueLine = {
  speaker?: string
  speakerEn?: string
  text: string
  textEn?: string
  shake?: boolean
}

export type Choice = {
  id: string
  label: string
  response: DialogueLine[]
}

export type CinematicStep =
  | {
      type: 'black'
      lines: DialogueLine[]
    }
  | {
      type: 'scene'
      image: string
      alt: string
      lines: DialogueLine[]
      choices?: Choice[]
    }

export const openingChapter: CinematicStep[] = [
  {
    type: 'black',
    lines: [{ text: 'سامحني.' }],
  },
  {
    type: 'scene',
    image: '/scenes/throne-room.png',
    alt: 'قاعة عرش رخامية ضخمة، الشموع تذوب والمطر يضرب النوافذ الملونة، والتاج الذهبي على وسادة مخملية',
    lines: [
      {
        speaker: 'الراوي',
        text: 'في الليلة التي كان من المفترض أن تلمس فيها التاج جبينك... أُغلقت الأبواب خلفك.',
        shake: true,
      },
    ],
  },
  {
    type: 'scene',
    image: '/scenes/asef-enters.png',
    alt: 'عاصف يدخل بملابس سوداء وخلفه أربعة حراس بخوذات حديدية',
    lines: [
      {
        speaker: 'عاصف',
        text: 'العرش لا يُمنح بالدم وحده، يا ليث. يُؤخذ بالحديد.',
      },
    ],
  },
  {
    type: 'scene',
    image: '/scenes/asef-closeup.png',
    alt: 'لقطة قريبة لوجه عاصف: ندبة على خده وألم مكبوت في عينيه',
    lines: [
      {
        speaker: 'الراوي',
        text: 'ترى في وجهه ندبة قديمة... وارتعاشة خفية في زاوية عينه. ألم مكبوت. ماذا تفعل؟',
      },
    ],
    choices: [
      {
        id: 'ask',
        label: 'اطلب منه التفسير: "لماذا يا عاصف؟"',
        response: [
          {
            speaker: 'عاصف',
            text: '"لماذا؟"... سؤال يطرحه من عاش حياته دون أن يُداس عليه.',
          },
        ],
      },
      {
        id: 'rebuke',
        label: 'وبخه: "لقد خانك أبي!"',
        response: [
          {
            speaker: 'عاصف',
            text: 'أبوك؟ أبوك مات مطمئناً. أما أنا... فقد دفنت أهلي بيدي.',
          },
        ],
      },
      {
        id: 'silent',
        label: 'اصمت وانظر إليه',
        response: [
          {
            speaker: 'عاصف',
            text: 'صمتك هذا... كان دائماً أثقل من كلامك.',
          },
        ],
      },
      {
        id: 'crown',
        label: 'حاول أن تصل إلى التاج',
        response: [
          {
            speaker: 'الراوي',
            text: 'تندفع نحو التاج... لكن قبضات الحراس الحديدية تسبقك إليه.',
            shake: true,
          },
        ],
      },
    ],
  },
  {
    type: 'scene',
    image: '/scenes/asef-closeup.png',
    alt: 'عاصف يقترب ويهمس',
    lines: [
      {
        speaker: 'عاصف',
        text: 'كبرنا معاً، ضحكنا معاً... والآن أنت تأمرني. لا. ليس بعد اليوم.',
      },
      {
        speaker: 'الراوي',
        text: 'يومئ للحراس. قبضاتهم الحديدية تمسك ذراعيك. يسحبونك نحو الشرفة الخلفية. المطر يبلل وجهك.',
        shake: true,
      },
    ],
  },
  {
    type: 'scene',
    image: '/scenes/the-fall.png',
    alt: 'ليث يسقط من شرفة القصر نحو البحر الأسود والتاج يطير في الهواء',
    lines: [
      {
        speaker: 'الراوي',
        text: 'الزمن يتباطأ... التاج يطير من الوسادة. عاصف يمد يده ليمسكه... لكن عينيه تدمعان للحظة.',
      },
    ],
  },
  {
    type: 'scene',
    image: '/scenes/underwater.png',
    alt: 'ليث يغرق في أعماق البحر المظلم والفقاعات تتصاعد',
    lines: [
      {
        speaker: 'الراوي',
        text: 'الماء البارد يلف جسدك. فقاعات. ضوء يختفي.',
      },
    ],
  },
  {
    type: 'black',
    lines: [{ text: 'ابتلعني البحر... فابتلع اسمي معه.' }],
  },
]

export const villageChapter: CinematicStep[] = [
  {
    type: 'black',
    lines: [{ text: 'الفصل الثاني: القرية' }],
  },
  {
    type: 'scene',
    image: '/scenes/cabin.png',
    alt: 'الكوخ في الصباح، إيلي تجهز سلة',
    lines: [
      {
        speaker: 'الراوي',
        text: 'مرت ثلاثة أيام. عادت قوتك ببطء... وبدأت كلمات إيلي الإنجليزية تستقر في ذهنك.',
      },
      {
        speaker: 'إيلي',
        text: '"You are stronger now, Laith. Come with me to the village. We need bread."',
      },
    ],
  },
  {
    type: 'scene',
    image: '/scenes/village.png',
    alt: 'قرية ساحلية صغيرة في الصباح، شوارع رملية وأكواخ حجرية وشباك صيد معلقة',
    lines: [
      {
        speaker: 'الراوي',
        text: 'قرية صغيرة على حافة البحر. روائح الخبز والسمك المشوي. لا أحد هنا يعرف أنك أمير.',
      },
      {
        speaker: 'إيلي',
        text: '"See the baker there? Go buy bread. Speak English — you can do it. I will watch."',
      },
    ],
    choices: [
      {
        id: 'confident',
        label: 'تقبل التحدي: "سأفعلها."',
        response: [
          {
            speaker: 'إيلي',
            text: '"Good! Remember: Good morning... I want bread, please. Go!"',
          },
        ],
      },
      {
        id: 'nervous',
        label: 'تتردد: "ماذا لو أخطأت؟"',
        response: [
          {
            speaker: 'إيلي',
            text: '"Mistakes are okay, Laith. The baker is kind. Just try."',
          },
        ],
      },
    ],
  },
]

export const posterScene: CinematicStep[] = [
  {
    type: 'scene',
    image: '/scenes/wanted-poster.png',
    alt: 'ملصق مطلوب على لوحة خشبية يحمل رسماً لوجه ليث وحارسان في الخلفية',
    lines: [
      {
        speaker: 'الراوي',
        text: 'وأنت تحمل الخبز... يتجمد الدم في عروقك. على لوحة الإعلانات... وجهك.',
        shake: true,
      },
      {
        speaker: 'الراوي',
        text: 'حارسان بخوذات حديدية يعلقان المزيد من الملصقات. رجال عاصف... وصلوا إلى هنا.',
      },
      {
        speaker: 'إيلي',
        text: '"Laith? Your face is white... Who is that man on the poster?"',
      },
      {
        speaker: 'الراوي',
        text: 'تنظر إليها. اللحظة التي كنت تخشاها... حان وقت الحقيقة.',
      },
    ],
  },
  {
    type: 'black',
    lines: [{ text: 'الرمل يخفي الأقدام... لكنه لا يخفي الوجوه.' }],
  },
]

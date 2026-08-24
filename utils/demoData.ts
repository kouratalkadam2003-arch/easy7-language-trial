import { WordData } from '../types';

export const createDemoData = (
    langCode: string, 
    charA: string, 
    charB: string, 
    location: string, 
    nationality: string,
    hello: string,
    texts: { original: string, native?: string, translation: string, words: any[], extra: any[], grammar: any }
) => {
    const story = JSON.stringify({
        originalText: texts.original,
        nativeScriptText: texts.native || texts.original,
        translatedText: texts.translation,
        wordList: texts.words,
        additionalExpressions: texts.extra,
        basicVocabulary: texts.words.map(w => ({ word: w.word, translation: w.translation })),
        grammarTip: texts.grammar
    });

    const sentences = texts.original.split('\n').filter(s => s.trim().length > 0);
    const nativeSentences = texts.native ? texts.native.split('\n').filter(s => s.trim().length > 0) : sentences;
    const translatedSentences = texts.translation.split('\n').filter(s => s.trim().length > 0);

    const drills = sentences.map((sentence, index) => {
        const trans = translatedSentences[index] || "...";
        const nat = nativeSentences[index] || sentence;
        
        let specificSubstitutions = [];
        let specificVisualization = "";

        if (sentence.includes(hello) || index === 0) {
            specificSubstitutions = [
                { changedWord: "Omar", fullSentence: `${hello} Omar`, translation: `مرحباً عمر` },
                { changedWord: "Yassin", fullSentence: `${hello} Yassin`, translation: `مرحباً ياسين` },
                { changedWord: "Teacher", fullSentence: `${hello} Teacher`, translation: `مرحباً يا معلم` },
                { changedWord: "Doctor", fullSentence: `${hello} Doctor`, translation: `مرحباً يا دكتور` },
                { changedWord: "Mister", fullSentence: `${hello} Mister`, translation: `مرحباً يا سيد` },
                { changedWord: "Friend", fullSentence: `${hello} Friend`, translation: `مرحباً يا صديقي` }
            ];
            specificVisualization = `تخيل أنك في مطار نيويورك. واجهت مشكلة في الحقائب ورأيت موظفاً. بـأي كلمة تبدأ الحديث معه؟`;
        } else if (sentence.includes("name") || sentence.includes("appelle")) {
             specificSubstitutions = [
                { changedWord: "Sara", fullSentence: sentence.replace(charA, "Sara").replace(charB, "Sara"), translation: trans + " (سارة)" },
                { changedWord: "John", fullSentence: sentence.replace(charA, "John").replace(charB, "John"), translation: trans + " (جون)" },
                { changedWord: "Ali", fullSentence: sentence.replace(charA, "Ali").replace(charB, "Ali"), translation: trans + " (علي)" },
                { changedWord: "Doctor", fullSentence: sentence.replace(charA, "Doctor").replace(charB, "Doctor"), translation: trans + " (الطبيب)" },
                { changedWord: "Engineer", fullSentence: sentence.replace(charA, "Engineer").replace(charB, "Engineer"), translation: trans + " (المهندس)" },
                { changedWord: "Student", fullSentence: sentence.replace(charA, "Student").replace(charB, "Student"), translation: trans + " (الطالب)" }
            ];
            specificVisualization = `تخيل أن الضابط يسألك عن اسمك لتسجيل الدخول. ماذا تقول؟`;
        } else {
             specificSubstitutions = [
                { changedWord: "Variaton 1", fullSentence: sentence + " (1)", translation: trans + " (1)" },
                { changedWord: "Variaton 2", fullSentence: sentence + " (2)", translation: trans + " (2)" },
                { changedWord: "Variaton 3", fullSentence: sentence + " (3)", translation: trans + " (3)" },
                { changedWord: "Variaton 4", fullSentence: sentence + " (4)", translation: trans + " (4)" },
                { changedWord: "Variaton 5", fullSentence: sentence + " (5)", translation: trans + " (5)" },
                { changedWord: "Variaton 6", fullSentence: sentence + " (6)", translation: trans + " (6)" }
            ];
            specificVisualization = `تخيل موقفاً يتطلب منك قول هذه الجملة تحديداً.`;
        }

        return {
            originalSentence: sentence,
            translation: trans,
            nativeScript: nat,
            visualizationPrompt: specificVisualization,
            substitutions: specificSubstitutions
        };
    });

    const memory = JSON.stringify({
        drills: drills
    });

    const review = JSON.stringify({
        flashcards: sentences.map((sentence, index) => ({
            original: sentence,
            translation: translatedSentences[index] || "",
            native: nativeSentences[index] || sentence
        }))
    });

    const chat = JSON.stringify({
        messages: [
            { speaker: "A", speakerName: charA, text: `${hello} ${charB}!`, pronunciation: "...", translation: `مرحباً ${charB}!`, gender: "female" },
            { speaker: "B", speakerName: charB, text: `${hello} ${charA}!`, pronunciation: "...", translation: `أهلاً ${charA}!`, gender: "male" }
        ]
    });

    return {
        data: {
            [`lesson-1-ar-${langCode}-A1-story-v6-cumulative`]: story,
            [`lesson-1-ar-${langCode}-A1-memory-v1-cumulative`]: memory,
            [`lesson-1-ar-${langCode}-A1-review-v8-cumulative`]: review,
            [`lesson-1-ar-${langCode}-A1-textChat-v8-cumulative`]: chat,
        },
        words: texts.words // Return words separately for cache population
    };
};

export const demoGeneratorResults = [
    createDemoData('fr', 'Marie', 'Pierre', 'Paris', 'français', 'Bonjour', {
        original: "Bonjour !\nJe m'appelle Marie.\nComment t'appelles-tu ?\nSalut Marie !\nJe m'appelle Pierre.\nEnchanté.\nEnchantée, Pierre.\nTu es français ?\nOui, je suis français.\nEt toi ?\nMoi aussi.\nJ'habite à Paris.\nJ'aime beaucoup Paris.\nC'est une belle ville.",
        translation: "مرحبًا!\nاسمي ماري.\nما اسمك؟\nأهلاً ماري!\nاسمي بيير.\nتشرفت بمعرفتك.\nتشرفت بك يا بيير.\nهل أنت فرنسي؟\nنعم، أنا فرنسي.\nوأنتِ؟\nأنا أيضًا.\nأسكن في باريس.\nأنا أحب باريس كثيراً.\nإنها مدينة جميلة.",
        words: [
            { word: "Bonjour", native_script: "Bonjour", translation: "مرحبًا" },
            { word: "Enchanté", native_script: "Enchanté", translation: "تشرفت بمعرفتك" },
            { word: "Paris", native_script: "Paris", translation: "باريس" },
            { word: "Je", translation: "أنا" }, { word: "Tu", translation: "أنت" }, { word: "ville", translation: "مدينة" }
        ],
        extra: [{ phrase: "Ça va ?", translation: "كيف الحال؟" }],
        grammar: { title: "Le verbe Être", tip: "'Je suis' means 'I am'. 'Tu es' means 'You are'." }
    }),
    createDemoData('en', 'Alice', 'Bob', 'London', 'British', 'Hello', {
        original: "Hello!\nMy name is Alice.\nWhat is your name?\nHi Alice!\nI am Bob.\nNice to meet you.\nNice to meet you too, Bob.\nAre you British?\nYes, I am British.\nAnd you?\nMe too.\nI live in London.\nDo you like London?\nYes, I love it.",
        translation: "مرحبًا!\nاسمي أليس.\nما اسمك؟\nأهلاً أليس!\nأنا بوب.\nتشرفت بمعرفتك.\nتشرفت بك أيضاً يا بوب.\nهل أنت بريطاني؟\nنعم، أنا بريطاني.\nوأنتِ؟\nأنا أيضاً.\nأعيش في لندن.\nهل تحب لندن؟\nنعم، أنا أحبها.",
        words: [
            { word: "Hello", native_script: "Hello", translation: "مرحبًا" },
            { word: "Nice to meet you", native_script: "Nice to meet you", translation: "تشرفت بمعرفتك" },
            { word: "London", native_script: "London", translation: "لندن" },
            { word: "British", translation: "بريطاني" }, { word: "live", translation: "يعيش" }
        ],
        extra: [{ phrase: "How are you?", translation: "كيف حالك؟" }],
        grammar: { title: "Verb To Be", tip: "'I am' is used for self. 'You are' is used for others." }
    }),
    createDemoData('es', 'Elena', 'Carlos', 'Madrid', 'español', 'Hola', {
        original: "¡Hola!\nMe llamo Elena.\n¿Cómo te llamas?\n¡Hola Elena!\nSoy Carlos.\nMucho gusto.\nIgualmente, Carlos.\n¿Eres español?\nSí, soy español.\n¿Y tú?\nYo también.\nVivo en Madrid.\n¿Te gusta Madrid?\nSí, me encanta.",
        translation: "مرحبًا!\nاسمي إلينا.\nما اسمك؟\nأهلاً إلينا!\nأنا كارلوس.\nتشرفت بمعرفتك.\nوأنا أيضاً يا كارلوس.\nهل أنت إسباني؟\nنعم، أنا إسباني.\nوأنتِ؟\nأنا أيضاً.\nأعيش في مدريد.\nهل تحبين مدريد؟\nنعم، أحبها جداً.",
        words: [
            { word: "Hola", native_script: "Hola", translation: "مرحبًا" },
            { word: "Mucho gusto", native_script: "Mucho gusto", translation: "تشرفت بمعرفتك" },
            { word: "Madrid", native_script: "Madrid", translation: "مدريد" }
        ],
        extra: [{ phrase: "¿Qué tal?", translation: "كيف الحال؟" }],
        grammar: { title: "Ser vs Llamarse", tip: "'Soy' means 'I am'. 'Me llamo' means 'I call myself'." }
    }),
    createDemoData('de', 'Anna', 'Hans', 'Berlin', 'Deutscher', 'Hallo', {
        original: "Hallo!\nIch heiße Anna.\nWie heißt du?\nHallo Anna!\nIch bin Hans.\nFreut mich.\nFreut mich auch, Hans.\nBist du Deutscher?\nJa, ich bin Deutscher.\nUnd du?\nIch auch.\nIch wohne in Berlin.\nMagst du Berlin?\nJa, sehr.",
        translation: "مرحبًا!\nاسمي آنا.\nما اسمك؟\nأهلاً آنا!\nأنا هانز.\nتشرفت بمعرفتك.\nتشرفت بك أيضاً يا هانز.\nهل أنت ألماني؟\nنعم، أنا ألماني.\nوأنتِ؟\nأنا أيضاً.\nأعيش في برلين.\nهل تحبين برلين؟\nنعم، كثيراً.",
        words: [
            { word: "Hallo", native_script: "Hallo", translation: "مرحبًا" },
            { word: "Freut mich", native_script: "Freut mich", translation: "تشرفت بمعرفتك" },
            { word: "Berlin", native_script: "Berlin", translation: "برلين" }
        ],
        extra: [{ phrase: "Wie geht's?", translation: "كيف الحال؟" }],
        grammar: { title: "Verb Sein", tip: "'Ich bin' means 'I am'. 'Du bist' means 'You are'." }
    }),
    createDemoData('it', 'Giulia', 'Marco', 'Roma', 'italiano', 'Ciao', {
        original: "Ciao!\nMi chiamo Giulia.\nCome ti chiami?\nCiao Giulia!\nSono Marco.\nPiacere.\nPiacere mio, Marco.\nSei italiano?\nSì, sono italiano.\nE tu?\nAnch'io.\nAbito a Roma.\nTi piace Roma?\nSì, è bellissima.",
        translation: "مرحبًا!\nاسمي جوليا.\nما اسمك؟\nأهلاً جوليا!\nأنا ماركو.\nتشرفت بمعرفتك.\nتشرفت بك أيضاً يا ماركو.\nهل أنت إيطالي؟\nنعم، أنا إيطالي.\nوأنتِ؟\nأنا أيضاً.\nأعيش في روما.\nهل تحبين روما؟\nنعم، إنها جميلة جداً.",
        words: [
            { word: "Ciao", native_script: "Ciao", translation: "مرحبًا" },
            { word: "Piacere", native_script: "Piacere", translation: "تشرفت بمعرفتك" },
            { word: "Roma", native_script: "Roma", translation: "روما" }
        ],
        extra: [{ phrase: "Come stai?", translation: "كيف حالك؟" }],
        grammar: { title: "Essere", tip: "'Sono' means 'I am'. 'Sei' means 'You are'." }
    }),
    createDemoData('ja', 'Sakura', 'Ken', 'Tokyo', 'Nihonjin', 'Konnichiwa', {
        original: "Konnichiwa!\nWatashi no namae wa Sakura desu.\nOnamae wa nan desu ka?\nKonnichiwa Sakura!\nBoku wa Ken desu.\nHajimemashite.\nHajimemashite, Ken.\nNihonjin desu ka?\nHai, Nihonjin desu.\nAnata wa?\nWatashi mo desu.\nTokyo ni sunde imasu.\nTokyo wa suki desu ka?\nHai, daisuki desu.",
        native: "こんにちは！\n私の名前はさくらです。\nお名前は何ですか？\nこんにちはさくら！\n僕はけんです。\nはじめまして。\nはじめまして、けん。\n日本人ですか？\nはい、日本人です。\nあなたは？\n私もです。\n東京に住んでいます。\n東京は好きですか？\nはい、大好きです。",
        translation: "مرحبًا!\nاسمي ساكورا.\nما اسمك؟\nأهلاً ساكورا!\nأنا كين.\nتشرفت بمعرفتك.\nتشرفت بك يا كين.\nهل أنت ياباني؟\nنعم، أنا ياباني.\nوأنت؟\nأنا أيضاً.\nأعيش في طوكيو.\nهل تحب طوكيو؟\nنعم، أحبها جداً.",
        words: [
            { word: "Konnichiwa", native_script: "こんにちは", translation: "مرحبًا" },
            { word: "Hajimemashite", native_script: "はじめまして", translation: "تشرفت بمعرفتك" },
            { word: "Tokyo", native_script: "東京", translation: "طوكيو" }
        ],
        extra: [{ phrase: "Genki desu ka?", translation: "كيف حالك؟" }],
        grammar: { title: "Desu (です)", tip: "'Desu' acts like 'is/am/are' to make sentences polite." }
    }),
    createDemoData('zh', 'Mei', 'Wei', 'Beijing', 'Zhōngguó rén', 'Nǐ hǎo', {
        original: "Nǐ hǎo!\nWǒ jiào Méi.\nNǐ jiào shénme míngzì?\nNǐ hǎo Méi!\nWǒ jiào Wěi.\nHěn gāoxìng rènshi nǐ.\nWǒ yě hěn gāoxìng rènshi nǐ, Wěi.\nNǐ shì Zhōngguó rén ma?\nShì, wǒ shì Zhōngguó rén.\nNǐ ne?\nWǒ yě shì.\nWǒ zhù zài Běijīng.\nNǐ xǐhuān Běijīng ma?\nShì, wǒ hěn xǐhuān.",
        native: "你好！\n我叫梅。\n你叫什么名字？\n你好梅！\n我叫伟。\n很高兴认识你。\n我也很高兴认识你，伟。\n你是中国人吗？\n是，我是中国人。\n你呢？\n我也是。\n我住在北京。\n你喜欢北京吗？\n是，我很喜欢。",
        translation: "مرحبًا!\nاسمي ماي.\nما اسمك؟\nأهلاً ماي!\nاسمي واي.\nتشرفت بمعرفتك.\nوأنا أيضاً تشرفت بك يا واي.\nهل أنت صيني؟\nنعم، أنا صيني.\nوأنت؟\nأنا أيضاً.\nأعيش في بكين.\nهل تحب بكين؟\nنعم، أحبها كثيراً.",
        words: [
            { word: "Nǐ hǎo", native_script: "你好", translation: "مرحبًا" },
            { word: "Hěn gāoxìng", native_script: "很高兴", translation: "سعيد جداً" },
            { word: "Běijīng", native_script: "北京", translation: "بكين" }
        ],
        extra: [{ phrase: "Nǐ hǎo ma?", translation: "كيف حالك؟" }],
        grammar: { title: "Shì (是)", tip: "'Shì' is the verb 'to be' (am, is, are). Wǒ shì = I am." }
    }),
];

export const ALL_DEMO_CACHE = demoGeneratorResults.reduce((acc, curr) => ({ ...acc, ...curr.data }), {});

export const PRELOADED_WORD_CACHE: Record<string, WordData> = {};
demoGeneratorResults.forEach(res => {
    res.words.forEach(w => {
        const key = `ar:${w.word.toLowerCase()}`;
        PRELOADED_WORD_CACHE[key] = {
            translation: w.translation,
            native: w.native_script
        };
    });
});

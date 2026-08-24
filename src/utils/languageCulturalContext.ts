export interface CulturalContext {
    countryName: string;
    sarahCity: string;
    khalidCity: string;
    famousCities: string[];
    culturalThemes: string;
    sampleExpressionPrompt: string;
}

export function getLanguageCulturalContext(langCode: string, langName: string): CulturalContext {
    const code = (langCode || 'en').toLowerCase().trim();

    switch (code) {
        case 'ja':
            return {
                countryName: 'Japan (اليابان)',
                sarahCity: 'Tokyo (طوكيو)',
                khalidCity: 'Osaka or Kyoto (أوساكا أو كيوتو)',
                famousCities: ['Tokyo', 'Kyoto', 'Osaka', 'Sapporo', 'Fukuoka', 'Yokohama'],
                culturalThemes: 'Japanese daily life, Tokyo cafes and subways, Kyoto traditions, Osaka food culture, seasons and local customs.',
                sampleExpressionPrompt: 'Pick a popular Japanese everyday idiom or conversational phrase (like "いただきます", "お疲れ様", or a fun Osaka/Tokyo colloquial expression).'
            };
        case 'zh':
            return {
                countryName: 'China (الصين)',
                sarahCity: 'Beijing (بكين)',
                khalidCity: 'Shanghai or Guangzhou (شنغهاي أو قوانغتشو)',
                famousCities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou'],
                culturalThemes: 'Chinese urban life, Beijing tea culture, Shanghai modern vibes, Guangzhou food, high-speed rail travels and local traditions.',
                sampleExpressionPrompt: 'Pick a vibrant Chinese chengyu (成语) or popular everyday modern slang expression used in Beijing/Shanghai.'
            };
        case 'fr':
            return {
                countryName: 'France & Francophone world (فرنسا)',
                sarahCity: 'Paris (باريس)',
                khalidCity: 'Lyon or Marseille (ليون أو مارسيليا)',
                famousCities: ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nice', 'Montreal'],
                culturalThemes: 'French café culture, Parisian strolls, Lyon gastronomy, regional traditions, and daily French lifestyle.',
                sampleExpressionPrompt: 'Pick a colorful everyday French expression or idiom (like "poser un lapin", "avoir le coup de foudre", or a casual colloquial term).'
            };
        case 'de':
            return {
                countryName: 'Germany (ألمانيا)',
                sarahCity: 'Berlin (برلين)',
                khalidCity: 'Munich or Hamburg (ميونخ أو هامبورغ)',
                famousCities: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart'],
                culturalThemes: 'German urban lifestyle, Berlin arts and culture, Munich Bavarian charm, punctual trains, bakeries and seasonal markets.',
                sampleExpressionPrompt: 'Pick a witty German compound word or everyday idiom (like "die Daumen drücken", "Kummerspeck", or a common spoken phrase).'
            };
        case 'es':
            return {
                countryName: 'Spain & Hispanic world (إسبانيا والعالم الإسباني)',
                sarahCity: 'Madrid (مدريد)',
                khalidCity: 'Barcelona or Seville (برشلونة أو إشبيلية)',
                famousCities: ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Buenos Aires', 'Bogota'],
                culturalThemes: 'Spanish lifestyle, Madrid sunny plazas, Barcelona coastal energy, tapas, two kisses greetings, and vibrant street culture.',
                sampleExpressionPrompt: 'Pick a funny Spanish idiom (like "estar como una cabra", "tomar el pelo", or "hacer chuletas").'
            };
        case 'it':
            return {
                countryName: 'Italy (إيطاليا)',
                sarahCity: 'Rome (روما)',
                khalidCity: 'Milan or Florence (ميلانو أو فلورنسا)',
                famousCities: ['Rome', 'Milan', 'Florence', 'Naples', 'Venice', 'Turin'],
                culturalThemes: 'Italian lifestyle, morning espresso rituals in Rome, Milan design and fashion, Tuscan art, and passionate conversational gestures.',
                sampleExpressionPrompt: 'Pick a quintessential Italian idiom or expressive phrase (like "in bocca al lupo", "fare il bis", or "che bello").'
            };
        case 'en':
        default:
            return {
                countryName: 'the English-speaking world (UK, USA, etc.)',
                sarahCity: 'London (لندن)',
                khalidCity: 'New York (نيويورك)',
                famousCities: ['London', 'New York', 'Manchester', 'Edinburgh', 'Chicago', 'Sydney', 'Dublin'],
                culturalThemes: 'Cosmopolitan life in London and New York, cozy coffee shops, commutes, diverse neighborhoods, and casual banter.',
                sampleExpressionPrompt: 'Pick a popular everyday English idiom or modern conversational slang (like "piece of cake", "break a leg", or "hit the road").'
            };
    }
}

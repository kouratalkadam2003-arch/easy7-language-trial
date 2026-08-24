import { UserData, Flashcard } from '../types';
import { ALL_DEMO_CACHE, PRELOADED_WORD_CACHE } from './demoData';

export const CURRENT_DATA_VERSION = 4;

export const defaultUserData: UserData = {
    version: CURRENT_DATA_VERSION,
    nativeLanguageCode: 'ar',
    selectedLanguageCode: 'en', 
    difficultyLevel: 'A1',
    hasCompletedSetup: false,
    hasSeenPrologue: false,
    completedLevels: [],
    lessonProgress: {},
    cachedContent: ALL_DEMO_CACHE,
    wordDataCache: PRELOADED_WORD_CACHE,
    flashcards: {},
    coins: 100, 
    ownedSkins: ['classic'],
    equippedSkin: 'classic',
};

export const migrateUserData = (data: any): UserData => {
    let migratedData = { ...data };

    if (!migratedData.version || migratedData.version < 2) {
        console.log(`Migrating user data from v${migratedData.version || 1} to v2...`);
        if (Array.isArray(migratedData.flashcards)) {
            const oldFlashcards: Flashcard[] = migratedData.flashcards;
            const langCode = migratedData.selectedLanguageCode || defaultUserData.selectedLanguageCode;
            migratedData.flashcards = { [langCode]: oldFlashcards };
        }
        if (typeof migratedData.flashcards !== 'object' || migratedData.flashcards === null) {
            migratedData.flashcards = {};
        }
        migratedData.version = 2;
    }

    if (migratedData.version < 3) {
        console.log("Migrating user data from v2 to v3 (Adding Economy)...");
        migratedData.coins = 100;
        migratedData.ownedSkins = ['classic'];
        migratedData.equippedSkin = 'classic';
        migratedData.version = 3;
    }

    if (migratedData.version < 4) {
        migratedData.hasCompletedSetup = true;
        migratedData.version = 4;
    }
    
    if (!migratedData.cachedContent) migratedData.cachedContent = {};
    migratedData.cachedContent = { ...ALL_DEMO_CACHE, ...migratedData.cachedContent };
    
    if (!migratedData.wordDataCache) migratedData.wordDataCache = {};
    migratedData.wordDataCache = { ...PRELOADED_WORD_CACHE, ...migratedData.wordDataCache };

    if (!migratedData.lessonProgress) migratedData.lessonProgress = {};

    const finalData = {
        ...defaultUserData,
        ...migratedData,
        nativeLanguageCode: 'ar',
    };
    
    return finalData;
};

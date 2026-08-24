import React, { useState, useEffect, useRef } from 'react';
import { Language, Topic } from '../types';
import { speakText } from '../utils/audio';

interface SnowballStageProps {
    language: Language;
    nativeLanguage: Language;
    topic: Topic;
    level: string;
    onNextStage?: () => void;
    drills?: any[];
}

const baseVocab = [
    { ar: "مرحبا", en: "Hello", de: "Hallo", em: "👋" },
    { ar: "كيف حالك؟", en: "How are you?", de: "Wie geht es dir?", em: "🤔" },
    { ar: "أنا بخير", en: "I am fine", de: "Mir geht es gut", em: "👍" },
    { ar: "ما اسمك؟", en: "What is your name?", de: "Wie heißt du?", em: "❓" },
    { ar: "اسمي أحمد", en: "My name is Ahmed", de: "Mein Name ist Ahmed", em: "🧑" },
    { ar: "سعدت بلقائك", en: "Nice to meet you", de: "Schön dich kennenzulernen", em: "🤝" },
    { ar: "شكرا", en: "Thanks", de: "Danke", em: "🙏" },
    { ar: "وداعا", en: "Goodbye", de: "Auf Wiedersehen", em: "👋" }
];

const MAX_HP = 200;

const SnowballStage: React.FC<SnowballStageProps> = ({ language, nativeLanguage, topic, level, onNextStage, drills }) => {
    const [vocab, setVocab] = useState<any[]>([]);
    const [gameActive, setGameActive] = useState(false);
    const [currentWave, setCurrentWave] = useState(1);
    const [wordIndex, setWordIndex] = useState(0);
    const [plantHP, setPlantHP] = useState(MAX_HP);
    const [zombieHP, setZombieHP] = useState(MAX_HP);
    const [activeZombies, setActiveZombies] = useState<any[]>([]);
    const [activeShells, setActiveShells] = useState<any[]>([]);
    const [failedWords, setFailedWords] = useState<Set<any>>(new Set());
    const [isBossMode, setIsBossMode] = useState(false);
    const [bossZombie, setBossZombie] = useState<any>(null);
    const [globalZombieSpeed, setGlobalZombieSpeed] = useState(0.20);
    const [snowballStep, setSnowballStep] = useState(0);
    const [gameOverMessage, setGameOverMessage] = useState<{title: string, isWin: boolean} | null>(null);
    const [plantBubble, setPlantBubble] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<{role: 'zombie'|'user', text: string, em: string}[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const [shuffledChars, setShuffledChars] = useState<string[]>([]);
    const [hiddenChars, setHiddenChars] = useState<boolean[]>([]);
    const [currentOptions, setCurrentOptions] = useState<any[]>([]);
    const [currentAttackers, setCurrentAttackers] = useState<any[]>([]);
    const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);
    const [isPlantHit, setIsPlantHit] = useState(false);
    const [isZombieHit, setIsZombieHit] = useState(false);
    const [cannonTransform, setCannonTransform] = useState("rotate(-12deg) translateX(0)");

    const audioCtxRef = useRef<AudioContext | null>(null);
    const gameLoopRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Initialize vocab based on language or drills
        let newVocab = [];
        if (drills && drills.length > 0) {
            newVocab = drills.map((d, i) => ({
                ar: d.translation,
                text: d.originalSentence,
                em: d.emoji || "📖"
            }));
        } else {
            const langKey = language.code === 'en' ? 'en' : 'de';
            newVocab = baseVocab.map(v => ({ ar: v.ar, text: v[langKey as keyof typeof v], em: v.em }));
        }
        setVocab(newVocab);
        setGameActive(true);
        startWave(1, newVocab, false, new Set());
        
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [language, drills]);

    const playCannonSound = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    };

    const handleUpdateHP = (target: 'plant' | 'zombie', amount: number) => {
        if (target === 'plant') {
            setIsPlantHit(true);
            setTimeout(() => setIsPlantHit(false), 150);
            setPlantHP(prev => {
                const newHP = Math.max(0, prev - amount);
                if (newHP <= 0) endGame(false);
                return newHP;
            });
        } else {
            setIsZombieHit(true);
            setTimeout(() => setIsZombieHit(false), 150);
            setZombieHP(prev => {
                const newHP = Math.max(0, prev - amount);
                if (newHP <= 0) endGame(true);
                return newHP;
            });
        }
    };

    const endGame = (isWin: boolean) => {
        setGameActive(false);
        setGameOverMessage({
            title: isWin ? "انتصار ساحق 🏆" : "سقطت قلعتك 💀",
            isWin
        });
    };

    const spawnZombie = (text: string, emoji: string, yOffset: number = 20, isMainTarget: boolean = false) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newZombie = {
            id, team: 'zombie', x: 90, y: yOffset, speed: globalZombieSpeed,
            damage: 20, hp: 30, frozen: false, isMainTarget, text, emoji, isHit: false
        };
        setActiveZombies(prev => [...prev, newZombie]);
        return newZombie;
    };

    const fireShell = (targetZombie: any, textData: string, emojiData: string, freezeEffect: boolean = false) => {
        playCannonSound();
        setCannonTransform("rotate(-35deg) translateX(-15px)");
        setTimeout(() => setCannonTransform("rotate(-12deg) translateX(0)"), 150);
        const id = Math.random().toString(36).substr(2, 9);
        setActiveShells(prev => [...prev, {
            id, startX: 15, startY: 40, targetId: targetZombie?.id,
            progress: 0, damage: 50, freezeEffect, dead: false, textData, emojiData
        }]);
    };

    const clearUnits = () => {
        setActiveZombies(prev => prev.filter(z => z.id === bossZombie?.id));
        setActiveShells([]);
    };

    // Game Loop
    useEffect(() => {
        if (!gameActive) return;

        gameLoopRef.current = window.setInterval(() => {
            setActiveZombies(prev => {
                let updated = [...prev];
                let plantDamage = 0;
                let nextWord = false;

                updated = updated.map(u => {
                    if (u.hp <= 0 || u.frozen) return u;
                    const newX = u.x - u.speed;
                    
                    if (newX <= 10) {
                        plantDamage += u.damage;
                        if (u.id === bossZombie?.id) {
                            plantDamage += 9999;
                        } else if (u.isMainTarget && currentWave !== 6 && currentWave !== 5) {
                            if (!isBossMode) {
                                setFailedWords(fw => new Set(fw).add(vocab[wordIndex]));
                            }
                            nextWord = true;
                        }
                        return { ...u, x: newX, hp: 0 };
                    }
                    return { ...u, x: newX };
                }).filter(u => u.hp > 0);

                if (plantDamage > 0) handleUpdateHP('plant', plantDamage);
                if (nextWord) {
                    setWordIndex(prevIdx => {
                        const nextIdx = prevIdx + 1;
                        setTimeout(() => loadWord(nextIdx, currentWave, vocab, isBossMode, bossZombie), 0);
                        return nextIdx;
                    });
                }

                return updated;
            });

            setActiveShells(prev => {
                let updated = [...prev];
                updated = updated.map(s => {
                    let newProgress = s.progress + 0.05;
                    if (newProgress >= 1) {
                        // Hit
                        setActiveZombies(zombies => zombies.map(z => {
                            if (z.id === s.targetId && z.hp > 0) {
                                if (s.freezeEffect) return { ...z, frozen: true };
                                setTimeout(() => {
                                    setActiveZombies(curr => curr.map(cz => cz.id === z.id ? { ...cz, isHit: false } : cz));
                                }, 150);
                                return { ...z, hp: z.hp - s.damage, isHit: true };
                            }
                            return z;
                        }));
                        return { ...s, progress: 1, dead: true };
                    }
                    return { ...s, progress: newProgress };
                });
                return updated.filter(s => !s.dead);
            });

        }, 50);

        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [gameActive, currentWave, wordIndex, isBossMode, bossZombie, vocab]);

    const startWave = (wave: number, currentVocab: any[], currentIsBossMode: boolean, currentFailedWords: Set<any>) => {
        if (wave === 9) {
            if (currentFailedWords.size === 0) {
                triggerGodMode();
            } else {
                setIsBossMode(true);
                const newVocab = Array.from(currentFailedWords);
                setVocab(newVocab);
                setGlobalZombieSpeed(0.4);
                const bz = spawnZombie("الزعيم", "👹", 60, false);
                setActiveZombies(prev => prev.map(z => z.id === bz.id ? { ...z, hp: 99999, speed: 0.01 } : z));
                setBossZombie(bz);
                startWave(1, newVocab, true, currentFailedWords);
            }
            return;
        }

        clearUnits();
        setWordIndex(0);
        setCurrentWave(wave);
        setPlantBubble(null);
        setHasAnsweredCorrectly(false);
        
        if ((wave === 7 || wave === 8) && !currentIsBossMode) {
            setSnowballStep(0);
            setChatHistory([]);
            loadSnowballStep(0, currentVocab, wave);
        } else {
            loadWord(0, wave, currentVocab, currentIsBossMode, bossZombie);
        }
    };

    const loadWord = (idx: number, wave: number, currentVocab: any[], currentIsBossMode: boolean, currentBossZombie: any) => {
        if (idx >= currentVocab.length) {
            setTimeout(() => {
                if (currentIsBossMode) {
                    if (wave < 4) startWave(wave + 1, currentVocab, currentIsBossMode, failedWords);
                    else triggerGodMode();
                } else {
                    startWave(wave + 1, currentVocab, currentIsBossMode, failedWords);
                }
            }, 1000);
            return;
        }

        const word = currentVocab[idx];
        setHasAnsweredCorrectly(false);

        if (wave === 1) {
            setPlantBubble(`<span class="text-4xl">${word.em}</span> <span>${word.ar}</span>`);
            spawnZombie(word.ar, word.em, 20, true);
            const wrongOpts = currentVocab.filter((v:any) => v.text !== word.text).sort(() => 0.5 - Math.random()).slice(0, 2);
            setCurrentOptions([word, ...wrongOpts].sort(() => 0.5 - Math.random()));
        } 
        else if (wave === 2 || wave === 3) {
            setPlantBubble(`<span class="text-4xl">${word.em}</span> <span>${wave === 2 ? word.ar : word.text}</span>`);
            const wrong = currentVocab.filter((v:any) => v.text !== word.text).sort(() => 0.5 - Math.random()).slice(0, 2);
            
            // Add fallback in case currentVocab doesn't have enough options
            const wrong1 = wrong[0] || { text: '...', ar: '...' };
            const wrong2 = wrong[1] || { text: '...', ar: '...' };

            const attackers = [
                {txt: wave === 2 ? word.text : word.ar, em: "", ok: true}, 
                {txt: wave === 2 ? wrong1.text : wrong1.ar, em: "", ok: false}, 
                {txt: wave === 2 ? wrong2.text : wrong2.ar, em: "", ok: false}
            ].sort(() => 0.5 - Math.random());
            
            const lanes = [100, 60, 20];
            const spawned = attackers.map((att, i) => {
                const z = spawnZombie(att.txt, att.em, lanes[i], att.ok);
                return { unit: z, ok: att.ok };
            });
            setCurrentAttackers(spawned);
        }
        else if (wave === 4) {
            setPlantBubble(`<span class="text-4xl">${word.em}</span> اكتب لتجميده!`);
            spawnZombie(word.ar, word.em, 20, true);
            const safeText = word.text || word.ar || '';
            const targetText = safeText.toUpperCase().replace(/\s+/g, '');
            setShuffledChars(targetText.split('').sort(() => 0.5 - Math.random()));
            setHiddenChars(new Array(targetText.length).fill(false));
            setCurrentInput("");
            if (hiddenInputRef.current) {
                hiddenInputRef.current.value = "";
                setTimeout(() => hiddenInputRef.current?.focus(), 300);
            }
        }
        else if (wave === 5 || wave === 6) {
            setPlantBubble(`<span class="text-3xl">❓</span> <span dir="auto">${wave === 5 ? word.text : word.em}</span>`);
            const wrongOpts = currentVocab.filter((v:any) => wave === 5 ? v.em !== word.em : v.text !== word.text).sort(() => 0.5 - Math.random()).slice(0, 2);
            const wrong1 = wrongOpts[0] || { em: '...', text: '...' };
            const wrong2 = wrongOpts[1] || { em: '...', text: '...' };
            
            if (wave === 5) {
                setCurrentOptions([{em: word.em, ok: true}, {em: wrong1.em, ok: false}, {em: wrong2.em, ok: false}].sort(() => 0.5 - Math.random()));
            } else {
                setCurrentOptions([{text: word.text, ok: true}, {text: wrong1.text, ok: false}, {text: wrong2.text, ok: false}].sort(() => 0.5 - Math.random()));
            }
            
            spawnZombie(word.ar, "🧟", 20, true);
        }
    };

    const handleWave1Option = (o: any) => {
        const word = vocab[wordIndex];
        // Find the main target zombie
        const z = activeZombies.find(z => z.isMainTarget && z.hp > 0 && !z.frozen);
        if (!z) return;

        if (o.text === word.text) {
            speakText(word.text, language);
            fireShell(z, word.text, word.em);
            if (isBossMode && bossZombie) fireShell(bossZombie, "", "💥");
            setActiveZombies(prev => prev.map(uz => uz.id !== bossZombie?.id ? { ...uz, hp: 0 } : uz));
            setWordIndex(prev => prev + 1);
            setTimeout(() => loadWord(wordIndex + 1, currentWave, vocab, isBossMode, bossZombie), 1000);
        } else {
            if (!isBossMode) setFailedWords(fw => new Set(fw).add(word));
            handleUpdateHP('plant', 15);
        }
    };

    const handleWave23Option = (index: number) => {
        if (hasAnsweredCorrectly) return;
        const word = vocab[wordIndex];
        const target = currentAttackers[index];
        if (!target) return;

        if (target.ok) {
            setHasAnsweredCorrectly(true);
            speakText(word.text, language);
            fireShell(target.unit, word.text, word.em);
            if (isBossMode && bossZombie) fireShell(bossZombie, "", "💥");
            setActiveZombies(prev => prev.map(uz => uz.id !== bossZombie?.id ? { ...uz, hp: 0 } : uz));
            setWordIndex(prev => prev + 1);
            setTimeout(() => loadWord(wordIndex + 1, currentWave, vocab, isBossMode, bossZombie), 1000);
        } else {
            if (!isBossMode) setFailedWords(fw => new Set(fw).add(word));
            handleUpdateHP('plant', 15);
            fireShell(target.unit, "خطأ!", "❌");
        }
    };

    const handleWave4CharClick = (char: string, index: number) => {
        if (hiddenChars[index]) return;
        const newHidden = [...hiddenChars];
        newHidden[index] = true;
        setHiddenChars(newHidden);
        
        const newInput = currentInput + char;
        setCurrentInput(newInput);
        if (hiddenInputRef.current) hiddenInputRef.current.value = newInput;
        checkWave4Input(newInput);
    };

    const checkWave4Input = (input: string) => {
        const word = vocab[wordIndex];
        const safeText = word.text || word.ar || '';
        const targetText = safeText.toUpperCase().replace(/\s+/g, '');
        const z = activeZombies.find(z => z.isMainTarget);

        if (input === targetText) {
            speakText(word.text, language);
            if (z) fireShell(z, word.text, word.em, true);
            if (isBossMode && bossZombie) fireShell(bossZombie, "", "💥");
            setWordIndex(prev => prev + 1);
            setTimeout(() => loadWord(wordIndex + 1, currentWave, vocab, isBossMode, bossZombie), 1000);
        } else if (input.length === targetText.length) {
            if (!isBossMode) setFailedWords(fw => new Set(fw).add(word));
            handleUpdateHP('plant', 15);
            clearWave4Input();
        }
    };

    const clearWave4Input = () => {
        setCurrentInput("");
        setHiddenChars(new Array(shuffledChars.length).fill(false));
        if (hiddenInputRef.current) {
            hiddenInputRef.current.value = "";
            hiddenInputRef.current.focus();
        }
    };

    const handleWave5Option = (o: any) => {
        const word = vocab[wordIndex];
        const z = activeZombies.find(z => z.isMainTarget);
        if (o.ok) {
            speakText(word.text, language);
            if (z) fireShell(z, word.text, word.em);
            setActiveZombies(prev => prev.map(uz => ({ ...uz, hp: 0 })));
            setWordIndex(prev => prev + 1);
            setTimeout(() => loadWord(wordIndex + 1, currentWave, vocab, isBossMode, bossZombie), 1000);
        } else {
            if (!isBossMode) setFailedWords(fw => new Set(fw).add(word));
            setGlobalZombieSpeed(prev => prev + 0.1);
            handleUpdateHP('plant', 15);
        }
    };

    const loadSnowballStep = (step: number, currentVocab: any[], wave: number) => {
        if (!gameActive) return;

        if (step >= 2) {
            setTimeout(() => startWave(wave + 1, currentVocab, isBossMode, failedWords), 1000);
            return;
        }

        const config = wave === 7 
            ? { zLang: 'text', uLang: 'ar', zIdx: step % currentVocab.length, uIdx: (step + 1) % currentVocab.length }
            : { zLang: 'ar', uLang: 'text', zIdx: (step + 2) % currentVocab.length, uIdx: (step + 3) % currentVocab.length };

        const zText = config.zLang === 'text' ? currentVocab[config.zIdx].text : currentVocab[config.zIdx].ar;
        const zEm = currentVocab[config.zIdx].em;
        
        setChatHistory(prev => [...prev, { role: 'zombie', text: zText, em: zEm }]);
        spawnZombie(zText, zEm, 20 + Math.random() * 40);

        setCurrentOptions([...currentVocab].sort(() => 0.5 - Math.random()));
    };

    const handleSnowballOption = (v: any) => {
        const config = currentWave === 7 
            ? { zLang: 'text', uLang: 'ar', zIdx: snowballStep % vocab.length, uIdx: (snowballStep + 1) % vocab.length }
            : { zLang: 'ar', uLang: 'text', zIdx: (snowballStep + 2) % vocab.length, uIdx: (snowballStep + 3) % vocab.length };

        const vText = config.uLang === 'text' ? v.text : v.ar;
        const targetText = config.uLang === 'text' ? vocab[config.uIdx].text : vocab[config.uIdx].ar;

        if (vText === targetText) {
            speakText(config.uLang === 'text' ? vText : vocab[config.uIdx].text, language);
            setChatHistory(prev => [...prev, { role: 'user', text: vText, em: '' }]);
            
            const zTarget = activeZombies[0];
            if (zTarget) fireShell(zTarget, v.text, v.em);
            else fireShell({ id: 'dummy', x: 80, y: 20, hp: 100 }, v.text, v.em);
            
            setActiveZombies(prev => prev.map(uz => ({ ...uz, hp: 0 })));
            setCurrentOptions([]); // Hide options

            setSnowballStep(prev => prev + 1);
            setTimeout(() => loadSnowballStep(snowballStep + 1, vocab, currentWave), 1000);
        } else {
            const failedWord = vocab.find(vx => (config.uLang === 'text' ? vx.text : vx.ar) === targetText);
            if (failedWord) setFailedWords(fw => new Set(fw).add(failedWord));
            handleUpdateHP('plant', 15);
        }
    };

    const triggerGodMode = () => {
        if (!gameActive) return;
        clearUnits();
        setPlantBubble(null);
        setCurrentWave(9); // Just to set title
        
        let count = 0;
        const rush = setInterval(() => {
            const randomTarget = { id: `dummy-${count}`, x: 80 + Math.random()*20, y: Math.random()*80, hp: 100 };
            fireShell(randomTarget, "⚔️", "🔥");
            count++;
            if (count > 25) {
                clearInterval(rush);
                setTimeout(() => handleUpdateHP('zombie', 9999), 1000);
            }
        }, 100);
    };

    const titles: Record<number, string> = {
        1: "الموجة 1: المرادفات",
        2: "الموجة 2: الهجمات الثلاث (ترجمة)",
        3: "الموجة 3: الهجمات الثلاث (عربي)",
        4: "الموجة 4: اكتب صح (تجميد)",
        5: "الموجة 5: الرموز التعبيرية 1",
        6: "الموجة 6: الرموز التعبيرية 2",
        7: "الموجة 7: المحادثة (عربي)",
        8: "الموجة 8: المحادثة (أجنبي)",
        9: "الموجة 9: الزعيم الأخير (تصفية الأخطاء)"
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden text-white font-sans" dir="rtl">
            <style dangerouslySetInnerHTML={{__html: `
                .castle { transition: transform 0.1s; }
                .castle-hit { transform: translateX(-5px) rotate(-2deg) scale(0.95); filter: brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5); }
                .castle-hit-zombie { transform: translateX(5px) rotate(2deg) scale(0.95); filter: brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5); }
                .zombie-label { background: white; color: black; padding: 6px 16px; border-radius: 12px; border: 4px solid #1e293b; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.6); white-space: nowrap; direction: ltr; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
            `}} />

            {/* Game Layer */}
            <div className="relative h-[50vh] w-full bg-sky-900 border-b-4 border-amber-900 overflow-hidden z-10" dir="ltr">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-800 to-sky-600 opacity-50"></div>
                <div className="absolute bottom-0 w-full h-1/3 bg-green-900 border-t-4 border-green-700"></div>

                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 border-2 border-yellow-500 text-yellow-400 px-6 py-2 rounded-xl font-black text-xl z-50 shadow-lg text-center w-3/4 max-w-md">
                    {isBossMode ? `الزعيم الأخير - ${titles[currentWave]}` : titles[currentWave]}
                </div>

                {/* Plant Castle */}
                <div className={`absolute left-4 bottom-10 z-20 flex flex-col items-center castle transition-all duration-100 ${isPlantHit ? 'castle-hit' : ''}`}>
                    <div className="absolute top-[40%] left-[80%] flex items-center transition-transform duration-100 origin-left" style={{ transform: cannonTransform }}>
                        <div className="w-20 h-10 bg-gradient-to-r from-slate-800 to-black rounded-r-lg border-2 border-slate-900 shadow-2xl relative">
                            <div className="absolute -right-2 top-0 w-4 h-full bg-slate-900 rounded-full border-2 border-black"></div>
                        </div>
                    </div>
                    
                    {plantBubble && (
                        <div className="absolute bottom-full mb-4 bg-white text-black text-lg px-4 py-2 rounded-xl border-4 border-green-500 font-black whitespace-nowrap shadow-xl direction-ltr flex items-center gap-2 z-10" dangerouslySetInnerHTML={{__html: plantBubble}}></div>
                    )}
                    <div className="bg-[#450a0a] border-2 border-black h-3 w-20 sm:w-28 rounded-full overflow-hidden mb-2 relative z-10">
                        <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${Math.max(0, (plantHP / MAX_HP) * 100)}%`, backgroundColor: plantHP < 60 ? '#ef4444' : '#22c55e' }}></div>
                    </div>
                    <div className="text-xs font-black text-green-300 bg-black/70 px-3 py-1 rounded mb-1 relative z-10">قلعة النبات</div>
                    <div className="text-7xl filter drop-shadow-2xl relative z-10">🏰🌿</div>
                </div>

                {/* Zombie Castle */}
                <div className={`absolute right-4 bottom-10 z-20 flex flex-col items-center castle transition-all duration-100 ${isZombieHit ? 'castle-hit-zombie' : ''}`}>
                    <div className="bg-[#450a0a] border-2 border-black h-3 w-20 sm:w-28 rounded-full overflow-hidden mb-2">
                        <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${Math.max(0, (zombieHP / MAX_HP) * 100)}%` }}></div>
                    </div>
                    <div className="text-xs font-black text-purple-300 bg-black/70 px-3 py-1 rounded mb-1">قلعة الزومبي</div>
                    <div className="text-7xl filter drop-shadow-2xl">🏰🧟</div>
                </div>

                {/* Zombies */}
                {activeZombies.map(z => (
                    <div key={z.id} className={`absolute z-30 flex flex-col items-center justify-center transition-all duration-75 ${z.frozen ? 'grayscale opacity-70 pointer-events-none' : ''} ${z.isHit ? 'castle-hit-zombie' : ''} ${z.id === bossZombie?.id ? 'scale-[2.2] -translate-y-5 z-40 drop-shadow-[0_0_20px_red]' : 'drop-shadow-xl'}`} style={{ left: `${z.x}%`, bottom: `${z.y}px` }}>
                        {(z.emoji || z.text) && (
                            <div className="zombie-label" dir="ltr">
                                {z.emoji && <span className="text-4xl">{z.emoji}</span>}
                                {z.text && <span className="text-xl font-black">{z.text}</span>}
                            </div>
                        )}
                        <div className="text-5xl">🧟‍♂️</div>
                    </div>
                ))}

                {/* Shells */}
                {activeShells.map(s => {
                    const targetX = activeZombies.find(z => z.id === s.targetId)?.x || 95;
                    const targetY = activeZombies.find(z => z.id === s.targetId)?.y || 20;
                    const currentX = s.startX + (targetX - s.startX) * s.progress;
                    const currentY = s.startY + (targetY - s.startY) * s.progress + 200 * 4 * s.progress * (1 - s.progress);
                    
                    return (
                        <div key={s.id} className="absolute z-50 flex flex-col items-center justify-center pointer-events-none" style={{ left: `${currentX}%`, bottom: `${currentY}px` }}>
                            {s.emojiData && <div className="text-3xl mb-1 filter drop-shadow-lg">{s.emojiData}</div>}
                            {s.textData && <div className="bg-black/90 text-white text-xs px-2 py-1 rounded font-black whitespace-nowrap mb-1" dir="ltr">{s.textData}</div>}
                            <div className="w-8 h-8 bg-slate-800 rounded-full shadow-[0_0_15px_#ef4444] border-4 border-black"></div>
                        </div>
                    );
                })}
            </div>

            {/* Control Layer */}
            <div className="flex-1 flex flex-col bg-slate-900 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] border-t-4 border-slate-700 overflow-y-auto custom-scrollbar" ref={containerRef}>
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                    {currentWave === 1 && (
                        <div className="flex flex-wrap gap-4 justify-center w-full">
                            {currentOptions.map((o, i) => (
                                <button key={i} onClick={() => handleWave1Option(o)} className="bg-slate-700 hover:bg-indigo-600 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black text-lg sm:text-xl border-b-8 border-slate-900 active:border-b-0 active:translate-y-2 flex items-center justify-center gap-3 w-full max-w-[180px] sm:w-48 text-white transition-all">
                                    <span dir="ltr">{o.text}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {(currentWave === 2 || currentWave === 3) && (
                        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
                            {[1, 2, 3].map((num, i) => (
                                <button key={i} onClick={() => handleWave23Option(i)} className="bg-slate-800 hover:bg-indigo-600 px-6 py-5 rounded-2xl font-black text-2xl border-b-8 border-slate-950 active:border-b-0 active:translate-y-2 flex justify-between items-center text-white transition-all">
                                    <span>سهم {num}</span> <span className="text-4xl">🏹</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {currentWave === 4 && (
                        <div className="w-full max-w-lg flex flex-col items-center gap-6 relative" onClick={() => hiddenInputRef.current?.focus()}>
                            <input 
                                ref={hiddenInputRef}
                                type="text" 
                                className="absolute opacity-0 w-0 h-0 pointer-events-none" 
                                autoComplete="off"
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    if (val.length < currentInput.length) {
                                        clearWave4Input();
                                        return;
                                    }
                                    const lastChar = val.slice(-1);
                                    const btnIdx = shuffledChars.findIndex((c, i) => c === lastChar && !hiddenChars[i]);
                                    if (btnIdx !== -1) {
                                        handleWave4CharClick(lastChar, btnIdx);
                                    } else {
                                        if (hiddenInputRef.current) hiddenInputRef.current.value = currentInput;
                                    }
                                }}
                            />
                            <div className="w-full p-6 text-4xl text-center bg-slate-800 text-white font-black rounded-2xl border-4 border-indigo-500 min-h-[80px] tracking-widest uppercase shadow-inner dir-ltr cursor-text">
                                {currentInput}
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 w-full">
                                {shuffledChars.map((char, i) => (
                                    <button 
                                        key={i} 
                                        onClick={(e) => { e.stopPropagation(); handleWave4CharClick(char, i); }}
                                        className={`bg-indigo-600 hover:bg-indigo-500 text-white text-3xl font-black w-16 h-16 rounded-xl shadow-lg border-b-4 border-indigo-900 uppercase active:translate-y-1 active:border-b-0 transition-all ${hiddenChars[i] ? 'invisible' : 'visible'}`}
                                    >
                                        {char}
                                    </button>
                                ))}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); clearWave4Input(); }} className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-black text-2xl w-full mt-2 shadow-lg border-b-4 border-red-900 active:translate-y-1 active:border-b-0 transition-all">
                                مسح الأحرف
                            </button>
                        </div>
                    )}

                    {(currentWave === 5 || currentWave === 6) && (
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 w-full">
                            {currentOptions.map((o, i) => (
                                <button key={i} onClick={() => handleWave5Option(o)} className="text-5xl sm:text-7xl bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-4 sm:border-8 border-slate-600 hover:bg-slate-700 text-white active:scale-95 shadow-2xl flex items-center justify-center transition-all min-w-[100px] sm:min-w-[130px]">
                                    {currentWave === 5 ? <span>{o.em}</span> : <span className="text-xl sm:text-3xl">{o.text}</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    {(currentWave === 7 || currentWave === 8) && (
                        <div className="flex-1 w-full flex flex-col gap-4 h-full max-w-2xl mx-auto">
                            <div className="flex-1 bg-slate-800 rounded-2xl p-6 overflow-y-auto flex flex-col gap-4 border-4 border-slate-700 shadow-inner custom-scrollbar">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`px-5 py-2 rounded-2xl text-lg font-black shadow-lg ${msg.role === 'zombie' ? 'self-start bg-slate-600 text-white italic' : 'self-end bg-green-600 text-white'}`}>
                                        {msg.role === 'zombie' && <span className="text-2xl mr-2">{msg.em}</span>}
                                        <span dir={
                                            (msg.role === 'zombie' && currentWave === 7) || (msg.role === 'user' && currentWave === 8) 
                                            ? "auto" 
                                            : "rtl"
                                        }>{msg.text}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center pb-4">
                                {currentOptions.map((v, i) => (
                                    <button key={i} onClick={() => handleSnowballOption(v)} className="bg-slate-700 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl text-lg font-black border-b-4 border-slate-900 active:border-0 flex items-center gap-2 transition-all">
                                        {currentWave === 7 ? <span dir="rtl">{v.ar}</span> : <span dir="auto">{v.text}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {currentWave === 9 && isBossMode && (
                        <div className="text-5xl font-black text-green-400 animate-pulse text-center drop-shadow-lg">
                            تدمير قلعة الزومبي جاري...
                        </div>
                    )}
                </div>
                
                {/* WAVE NAVIGATOR (For easy skipping) */}
                <div className="bg-slate-950 p-2 flex flex-wrap justify-center gap-2 border-t-2 border-slate-800 mt-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(w => (
                        <button 
                            key={w} 
                            onClick={() => startWave(w, vocab, isBossMode, failedWords)} 
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all focus:outline-none ${currentWave === w ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-2 border-slate-700'}`}
                        >
                            تخطي ➡️ {w}
                        </button>
                    ))}
                </div>
            </div>

            {/* Game Over Overlay */}
            {gameOverMessage && (
                <div className="fixed inset-0 bg-slate-950/95 z-[100] flex flex-col items-center justify-center text-center p-4">
                    <h2 className={`text-5xl font-black mb-4 drop-shadow-lg ${gameOverMessage.isWin ? 'text-yellow-400' : 'text-red-500'}`}>
                        {gameOverMessage.title}
                    </h2>
                    <div className="flex gap-4 mt-6">
                        <button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-black text-xl uppercase shadow-[0_0_20px_rgba(79,70,229,0.5)] active:scale-95 transition-transform">
                            إعادة اللعب
                        </button>
                        {onNextStage && (
                            <button onClick={onNextStage} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-black text-xl uppercase shadow-[0_0_20px_rgba(34,197,94,0.5)] active:scale-95 transition-transform">
                                التالي
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SnowballStage;

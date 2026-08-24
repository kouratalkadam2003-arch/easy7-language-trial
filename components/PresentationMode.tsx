import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Globe, LogIn, TrendingDown, BrainCircuit, Activity, Cloud, Coins, Rocket, Radio, Sword, Shield, BookOpen, Layers, Users, Zap, CheckCircle, ChevronDown, ChevronUp, Map, Database, Code } from 'lucide-react';

interface PresentationModeProps {
    onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({ onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 16; // 0 to 15

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
                setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
                setCurrentSlide((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalSlides, onClose]);

    const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
    const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

    // Slide definitions
    const slides = [
        // 0. Title Slide
        <div key="0" className="flex flex-col items-center justify-center h-full text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="z-10">
                <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6 drop-shadow-lg">
                    Easy 7 Language
                </h1>
                <p className="text-3xl font-light text-slate-300 mb-12">الاكتساب الطبيعي للغات مدعوماً بالذكاء الاصطناعي</p>
                <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 mx-auto rounded-full mb-12"></div>
                <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl inline-block">
                    <p className="text-xl text-slate-400 mb-2">إعداد وتقديم</p>
                    <p className="text-4xl font-bold text-white">فارس إسلام بوغازي</p>
                </div>
            </motion.div>
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600 rounded-full blur-[150px]"></div>
            </div>
        </div>,

        // 1. Problem & Solution
        <div key="1" className="flex flex-col h-full p-12 justify-center">
            <h2 className="text-5xl font-black text-white mb-16 text-center">الإشكالية والحل</h2>
            <div className="grid grid-cols-2 gap-12 w-full max-w-6xl mx-auto">
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-800/50 p-8 rounded-3xl border border-rose-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown size={100} className="text-rose-500" /></div>
                    <h3 className="text-3xl font-bold text-rose-400 mb-8 flex items-center gap-3"><Activity /> المشكلة: الفشل في الاستمرار</h3>
                    
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-bold"><span className="text-rose-300">معدل التسرب</span><span className="text-rose-400">85%</span></div>
                            <div className="w-full h-8 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ delay: 0.5, duration: 1 }} className="h-full bg-gradient-to-r from-rose-600 to-red-500"></motion.div>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-black mix-blend-difference">تطبيقات تقليدية</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-bold"><span className="text-orange-300">منحنى النسيان (إيبنجهاوس)</span><span className="text-orange-400">70% فقدان</span></div>
                            <div className="w-full h-8 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                                <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ delay: 1, duration: 1 }} className="h-full bg-gradient-to-r from-orange-600 to-amber-500"></motion.div>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-black mix-blend-difference">بعد 24 ساعة فقط</span>
                            </div>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-lg mt-4 border-r-4 border-rose-500 pr-4">التطبيقات الحالية تعتمد على الحفظ الميكانيكي الممل وغياب السياق العاطفي، مما يؤدي للملل السريع والانسحاب.</p>
                    </div>
                </motion.div>

                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-slate-800/50 p-8 rounded-3xl border border-emerald-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><h2 className="text-9xl">7</h2></div>
                    <h3 className="text-3xl font-bold text-emerald-400 mb-8 flex items-center gap-3"><CheckCircle /> الحل: الاكتساب الطبيعي</h3>
                    
                    <ul className="space-y-6 text-xl">
                        <li className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">1</div>
                            <span className="text-slate-200"><strong>المنهجية السباعية:</strong> دمج 7 حواس ومهارات في آن واحد (استماع، تفاعل، لعب، تحدث حُر...)</span>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">2</div>
                            <span className="text-slate-200"><strong>إلغاء الترجمة الحرفية:</strong> ربط الكلمة بالصورة والصوت والموقف لتحفيز الذاكرة العاطفية.</span>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">3</div>
                            <span className="text-slate-200"><strong>التلعيب (Gamification):</strong> استخدام سيكولوجية "النفور من الخسارة" للإبقاء على المستخدم.</span>
                        </li>
                    </ul>
                </motion.div>
            </div>
        </div>,

        // 2. Login Screen
        <div key="2" className="flex flex-col h-full items-center justify-center relative overflow-hidden">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-12 z-10">1. كسر حاجز الرهبة</motion.h2>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-slate-900 border-4 border-slate-700 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-10 flex flex-col items-center p-8">
                <div className="w-32 h-32 bg-indigo-500 rounded-full mb-6 text-7xl flex items-center justify-center shadow-lg border-4 border-indigo-300">👋</div>
                <h3 className="text-3xl font-black text-white mb-2">مرحباً بك!</h3>
                <p className="text-slate-400 text-center mb-8">ابدأ رحلتك الممتعة لتتحدث بثقة</p>
                <div className="w-full space-y-4">
                    <div className="w-full bg-slate-800 p-4 rounded-xl text-slate-500 font-bold border border-slate-700 text-center" dir="ltr">Enter your name...</div>
                    <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl py-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2">
                        <span>انطلق الآن</span> 🚀
                    </button>
                </div>
            </motion.div>
            <p className="mt-8 text-xl text-emerald-400 font-bold z-10 border-r-4 border-emerald-400 pr-4">"واجهة ترحيبية دافئة، خالية من التعقيدات للبدء الفوري."</p>
        </div>,

        // 3. Language Selection
        <div key="3" className="flex flex-col h-full items-center justify-center relative">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-12">2. اختيار اللغة (7 لغات مدعومة)</motion.h2>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-4 gap-6 w-full max-w-4xl mx-auto p-8">
                {[
                    { id: 'en', name: 'الإنجليزية', flag: '🇬🇧', animal: '🦊', color: 'from-blue-500 to-indigo-600' },
                    { id: 'es', name: 'الإسبانية', flag: '🇪🇸', animal: '🐂', color: 'from-red-500 to-orange-600' },
                    { id: 'fr', name: 'الفرنسية', flag: '🇫🇷', animal: '🐓', color: 'from-blue-400 to-blue-600' },
                    { id: 'de', name: 'الألمانية', flag: '🇩🇪', animal: '🦅', color: 'from-yellow-400 to-orange-500' },
                    { id: 'it', name: 'الإيطالية', flag: '🇮🇹', animal: '🐺', color: 'from-green-500 to-red-500' },
                    { id: 'ja', name: 'اليابانية', flag: '🇯🇵', animal: '🐱', color: 'from-rose-400 to-red-500' },
                    { id: 'kr', name: 'الكورية', flag: '🇰🇷', animal: '🐯', color: 'from-blue-500 to-red-500' },
                ].map((lang, idx) => (
                    <motion.div key={lang.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.1 }} className={`bg-gradient-to-br ${lang.color} p-1 rounded-3xl shadow-xl aspect-square flex flex-col items-center justify-center relative overflow-hidden group`}>
                        <div className="absolute inset-1 bg-slate-900 rounded-[22px] flex flex-col items-center justify-center p-4">
                            <span className="text-5xl drop-shadow-md mb-2 group-hover:scale-125 transition-transform">{lang.animal}</span>
                            <h3 className="font-black text-lg text-white group-hover:text-amber-300 transition-colors">{lang.name}</h3>
                            <span className="text-xs opacity-50">{lang.flag}</span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
            <p className="mt-8 text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4">"ارتباط بصري حيواني يفتح الشهية للتعلم ويضفي طابعاً طفولياً محبباً."</p>
        </div>,

        // 4. Farm Preparation
        <div key="4" className="flex flex-col h-full items-center justify-center">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-12">3. تهيئة بيئة التعلم</motion.h2>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-lg bg-slate-800 p-12 rounded-3xl shadow-2xl border-2 border-emerald-500/50 flex flex-col items-center text-center">
                <div className="text-8xl mb-6 animate-bounce drop-shadow-lg">👧</div>
                <h3 className="text-3xl font-bold text-white mb-4">جاري تحضير مزرعتك...</h3>
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                    <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="h-full w-1/2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></motion.div>
                </div>
                <p className="mt-6 text-slate-400">نقوم بتجهيز المسار والذكاء الاصطناعي لك خصيصاً</p>
            </motion.div>
        </div>,

        // 5. Adventure Map Path
        <div key="5" className="flex flex-col h-full items-center justify-center relative p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-8 z-10 w-full text-right">4. خريطة المغامرة التفاعلية</motion.h2>
            <div className="flex-1 w-full flex items-center justify-center pb-8">
                <div className="w-full max-w-md h-[500px] bg-emerald-950/40 rounded-3xl border-4 border-emerald-900/50 p-6 relative overflow-hidden backdrop-blur-sm">
                    {/* SVG Path */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <motion.path 
                            d="M 50 90 Q 20 70 50 50 T 50 10" 
                            fill="none" 
                            stroke="#34d399" 
                            strokeWidth="4" 
                            strokeDasharray="6 6"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2 }}
                        />
                    </svg>
                    {/* Nodes */}
                    {[
                        { bottom: '10%', left: '50%', label: 'الأساسيات', active: true },
                        { bottom: '30%', left: '30%', label: 'التحيات', active: false },
                        { bottom: '50%', left: '50%', label: 'في المطعم', active: false },
                        { bottom: '70%', left: '70%', label: 'السفر', active: false },
                        { bottom: '90%', left: '50%', label: 'المقابلة', active: false },
                    ].map((node, i) => (
                        <div key={i} className="absolute flex flex-col items-center transform -translate-x-1/2 translate-y-1/2" style={{ bottom: node.bottom, left: node.left }}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border-4 z-10 ${node.active ? 'bg-amber-400 border-white text-black scale-110 shadow-[0_0_30px_rgba(251,191,36,0.8)] animate-pulse' : 'bg-slate-800 border-slate-600 grayscale'}`}>
                                {node.active ? '🦊' : '🔒'}
                            </div>
                            <span className={`mt-2 font-black px-3 py-1 rounded-full text-sm ${node.active ? 'bg-amber-400 text-black' : 'bg-slate-800 text-slate-400'}`}>{node.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <p className="text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4 mt-4">"مسار جغرافي يحاكي ثقافة اللغة، لإعطاء المتعلم حافزاً مرئياً بدلاً من القوائم المملة."</p>
        </div>,

        // 6. Interactive Listening
        <div key="6" className="flex flex-col h-full items-center justify-center relative p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-8 z-10 w-full text-right">5. الاستماع التفاعلي</motion.h2>
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex gap-8 mb-12">
                    <div className="w-48 h-48 bg-slate-800 rounded-2xl border-4 border-indigo-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        <span className="text-8xl filter drop-shadow-xl">👨‍🌾</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <div className="bg-slate-800 p-6 rounded-2xl rounded-tr-none border border-slate-700 relative">
                            <h3 className="text-2xl font-black text-indigo-400 mb-2" dir="ltr">Hello! Can I buy some fresh apples?</h3>
                            <button className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2 decoration-dashed underline underline-offset-4">أظهر الترجمة 👁️</button>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-2xl rounded-tl-none border border-slate-700 relative self-end text-right">
                            <h3 className="text-2xl font-black text-emerald-400 mb-2" dir="ltr">Yes, these are from today's harvest.</h3>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                    <button className="w-16 h-16 rounded-full bg-slate-800 hover:bg-indigo-600 border-2 border-indigo-500 flex items-center justify-center text-2xl font-black shadow-lg transition-colors">0.5x</button>
                    <button className="w-24 h-24 rounded-full bg-indigo-600 hover:bg-indigo-500 border-4 border-indigo-400 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(99,102,241,0.6)] pl-2 transition-transform active:scale-95">▶️</button>
                    <button className="w-16 h-16 rounded-full bg-slate-800 hover:bg-indigo-600 border-2 border-indigo-500 flex items-center justify-center text-2xl font-black shadow-lg transition-colors">1.0x</button>
                </div>
            </div>
            <p className="text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4 mt-8">"المتعلم يتحكم في سرعة الصوت لتعويد أذنه على النطق الصحيح ضمن مواقف حقيقية."</p>
        </div>,

        // 7. Game Center
        <div key="7" className="flex flex-col h-full items-center justify-center p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-12 w-full text-right w-full">6. مركز الألعاب (تثبيت الحفظ)</motion.h2>
            <div className="grid grid-cols-2 gap-12 w-full max-w-5xl">
                {/* Knife Hit */}
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl group relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
                    <div className="w-48 h-48 bg-slate-800 rounded-full border-[12px] border-[#8b5a2b] flex items-center justify-center mb-8 relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                        <span className="text-6xl animate-spin" style={{ animationDuration: '4s' }}>🍎</span>
                        <div className="absolute -bottom-6 text-4xl left-1/2 -translate-x-1/2 text-slate-300 transform -rotate-12">🔪</div>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-2">رمي السكاكين</h3>
                    <p className="text-slate-400 text-center font-bold">اربط الصوت بالمعنى بسرعة البرق.</p>
                </motion.div>

                {/* Zombies */}
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl group relative overflow-hidden">
                     <div className="absolute inset-0 bg-purple-600/5 group-hover:bg-purple-600/10 transition-colors"></div>
                    <div className="w-full flex items-center justify-between px-8 mb-8">
                        <div className="text-7xl filter drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">🏰🌿</div>
                        <div className="flex gap-2">
                             <div className="text-4xl drop-shadow-md animate-bounce" style={{ animationDelay: '0s' }}>🧟‍♂️</div>
                             <div className="text-4xl drop-shadow-md animate-bounce" style={{ animationDelay: '0.2s' }}>🧟‍♂️</div>
                             <div className="text-4xl drop-shadow-md animate-bounce" style={{ animationDelay: '0.4s' }}>🧟‍♂️</div>
                        </div>
                    </div>
                    <div className="w-full h-4 bg-slate-800 rounded-full mb-4 overflow-hidden"><div className="h-full bg-emerald-500 w-full animate-pulse"></div></div>
                    <h3 className="text-3xl font-black text-white mb-2">حرب الزومبي</h3>
                    <p className="text-slate-400 text-center font-bold">اختبر حفظك تحت ضغط الوقت.</p>
                </motion.div>
            </div>
            <p className="text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4 mt-12 w-full max-w-5xl">"كسر الجمود البيداغوجي وتثبيت المفردات عبر الأدرينالين!"</p>
        </div>,

        // 8. Voice Chat
        <div key="8" className="flex flex-col h-full items-center justify-center relative p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-8 w-full text-right w-full">7. المحادثة الصوتية الحية (Voice AI)</motion.h2>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900"></div>
                
                <h3 className="text-3xl font-black text-indigo-300 mb-12 z-10 text-center leading-relaxed">"أنا هنا لمساعدتك على التحدث بثقة!<br/>ماذا تريد أن نتعلم اليوم؟"</h3>

                <div className="relative flex items-center justify-center w-64 h-64 mb-8 z-10">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                    <div className="absolute inset-4 rounded-full border-4 border-indigo-400/40 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite_100ms]"></div>
                    
                    <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 shadow-[0_0_60px_rgba(99,102,241,0.6)] flex items-center justify-center z-10">
                         <div className="flex items-center justify-center gap-2">
                            <div className="w-3 bg-white rounded-full h-8 animate-[bounce_0.8s_infinite]"></div>
                            <div className="w-3 bg-white rounded-full h-16 animate-[bounce_0.8s_infinite_0.2s]"></div>
                            <div className="w-3 bg-white rounded-full h-24 animate-[bounce_0.8s_infinite_0.4s]"></div>
                            <div className="w-3 bg-white rounded-full h-12 animate-[bounce_0.8s_infinite_0.6s]"></div>
                            <div className="w-3 bg-white rounded-full h-6 animate-[bounce_0.8s_infinite]"></div>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 bg-white text-indigo-900 px-6 py-2 rounded-full font-black text-xl shadow-xl z-20 border-4 border-indigo-500">🐑 المُعلّم</div>
                </div>

                <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-4 flex items-center gap-4 z-10">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center"><Mic size={24} /></div>
                    <span className="text-slate-300 font-bold">تحدث الآن...</span>
                </div>
            </motion.div>
            <p className="text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4 mt-8 w-full max-w-4xl">"الضربة القاضية لوهم الطلاقة! محادثة حرة مع الذكاء الاصطناعي لكسر عقدة الخوف."</p>
        </div>,

        // 9. AI Radio
        <div key="9" className="flex flex-col h-full items-center justify-center relative p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-12 w-full text-right w-full">8. الميزة الجديدة: راديو الذكاء الاصطناعي</motion.h2>
            
            <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 p-12 rounded-3xl shadow-2xl flex items-center gap-12 relative overflow-hidden">
                <div className="w-1/3 flex flex-col items-center">
                     <div className="w-48 h-48 bg-gradient-to-tr from-amber-500 to-orange-400 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)] mb-6 border-8 border-slate-900">
                        <Radio size={80} className="text-white" />
                     </div>
                     <span className="bg-amber-500 text-black font-black px-6 py-2 rounded-full text-2xl uppercase tracking-widest">Live</span>
                </div>
                
                <div className="w-2/3 flex flex-col justify-center">
                    <h3 className="text-3xl font-black text-white mb-6">استمع لاهتماماتك باللغة الهدف!</h3>
                    <div className="flex gap-4 mb-8">
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1 text-center">
                            <span className="text-5xl block mb-2">👨🏼‍💼</span>
                            <span className="text-amber-400 font-bold">Dave (Host)</span>
                        </div>
                        <div className="flex items-center justify-center text-4xl text-slate-600">🎙️</div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1 text-center">
                            <span className="text-5xl block mb-2">👩🏼‍𱻧</span>
                            <span className="text-amber-400 font-bold">Sarah (Guest)</span>
                        </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between pl-6 gap-4">
                        <span className="text-slate-400 font-bold flex-1 text-left" dir="ltr">Topic: The Future of AI in Education</span>
                        <div className="flex gap-2">
                             <div className="w-1 h-6 bg-slate-600 animate-pulse"></div>
                             <div className="w-1 h-10 bg-amber-500 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                             <div className="w-1 h-4 bg-slate-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                             <div className="w-1 h-8 bg-amber-500 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4 mt-8 w-full max-w-5xl">"أعطنا موضوعاً يهمك، وسيقوم مذيعان من الذكاء الاصطناعي بمناقشته أمامك بصوت بشري طبيعي لتقوية الاستماع."</p>
        </div>,

        // 10. SRS Word Farm
        <div key="10" className="flex flex-col h-full items-center justify-center relative p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-12 w-full text-right w-full">9. محرك الاحتفاظ: المزرعة الذكية (SRS)</motion.h2>
            
            <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-8 flex">
                <div className="w-1/2 p-8 flex flex-col justify-center border-l border-slate-800">
                     <h3 className="text-3xl font-black text-emerald-400 mb-6 font-arabic whitespace-nowrap">النفور من الخسارة (Loss Aversion)</h3>
                     <p className="text-slate-300 text-lg leading-relaxed mb-6 font-bold">
                        كل كلمة تتعلمها تزرع كبذرة. إذا أهملت المراجعة المتباعدة (SRS)، تتعرض أشجارك للعواصف والأمراض وقد تموت!
                     </p>
                     <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-4">
                        <Activity className="text-red-500 shrink-0 mt-1" />
                        <div>
                             <span className="text-red-400 font-bold block mb-1">إشعار عاجل!</span>
                             <span className="text-sm text-slate-300">"أشجار التفاح الخاصة بك (الأفعال الشاذة) تتعرض لعاصفة قوية. عُد للمراجعة لإنقاذها!"</span>
                        </div>
                     </div>
                </div>
                
                <div className="w-1/2 p-8 flex items-center justify-center relative bg-[#1e293b]">
                     {/* Tree in storm */}
                     <div className="relative">
                        <motion.div animate={{ rotate: [-2, 5, -3, 6, -1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="origin-bottom filter brightness-75">
                            <span className="text-[150px]">🌳</span>
                        </motion.div>
                        <div className="absolute top-10 -right-10 text-5xl">⚡</div>
                        <div className="absolute top-20 -left-10 text-4xl">🌧️</div>
                     </div>
                </div>
            </div>
            <p className="text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4 mt-8 w-full max-w-5xl">"كيف نمنع المتعلم من الانسحاب؟ عبر غريزة الخوف من خسارة المجهود!"</p>
        </div>,

        // 11. Farm Shop & Crystal Haven
        <div key="11" className="flex flex-col h-full items-center justify-center p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-12 w-full text-right w-full">10. المتجر والملاذ الكريستالي</motion.h2>
            <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
                <div className="bg-slate-900 rounded-3xl border border-slate-700 p-8 shadow-2xl flex flex-col">
                    <h3 className="text-2xl font-black text-amber-400 mb-8 flex items-center gap-3 w-full justify-center border-b border-slate-800 pb-4"><Coins /> متجر المزرعة</h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        <div className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700">
                             <div className="flex items-center gap-4"><span className="text-4xl">🛡️</span><div><p className="font-bold text-white">درع الحماية</p><p className="text-xs text-slate-400">يحمي مزرعتك ليومين</p></div></div>
                             <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold text-sm">200 🪙</span>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700">
                             <div className="flex items-center gap-4"><span className="text-4xl">🤖</span><div><p className="font-bold text-white">فزاعة ذكية</p><p className="text-xs text-slate-400">مراجعة تلقائية جزئية</p></div></div>
                             <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold text-sm">500 🪙</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-3xl border border-slate-700 p-8 shadow-2xl flex flex-col relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 opacity-50 z-0"></div>
                     <h3 className="text-2xl font-black text-cyan-300 mb-8 z-10 flex items-center gap-3 w-full justify-center border-b border-slate-800 pb-4"><Cloud /> الملاذ الكريستالي</h3>
                     <div className="flex-1 flex flex-col items-center justify-center z-10">
                         <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="relative mb-6">
                             <span className="text-8xl drop-shadow-[0_0_30px_rgba(56,189,248,0.8)] filter">💎</span>
                         </motion.div>
                         <p className="text-center font-bold text-slate-300">الكلمات التي تتقنها بنسبة 100% تنتقل هنا، وتصبح خالدة ولا تحتاج للمراجعة المستمرة!</p>
                     </div>
                </div>
            </div>
            <p className="text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4 mt-8 w-full max-w-5xl">"اقتصاد داخلي يحفز الاستمرار، ومرحلة إتقان نهائية تُشعر المتعلم بالإنجاز الحقيقي."</p>
        </div>,

        // 12. Tech Stack
        <div key="12" className="flex flex-col h-full items-center justify-center p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-16 w-full text-right w-full">11. البنية التقنية (Serverless Architecture)</motion.h2>
            
            <div className="flex justify-center items-center gap-12 w-full max-w-5xl">
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-slate-900 rounded-3xl border-2 border-[#61DAFB] shadow-[0_0_30px_rgba(97,218,251,0.2)] flex items-center justify-center mb-6">
                        <Code size={64} color="#61DAFB" />
                    </div>
                    <span className="text-2xl font-black text-white">React.js</span>
                    <span className="text-slate-400 font-bold mt-2">واجهة المستخدم والألعاب</span>
                </motion.div>

                <div className="text-slate-600 hidden md:block">
                     <span className="text-5xl">↔️</span>
                </div>

                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
                    <div className="w-40 h-40 bg-slate-900 rounded-full border-4 border-[#FFA611] shadow-[0_0_50px_rgba(255,166,17,0.3)] flex items-center justify-center mb-6 z-10 relative">
                        <Database size={70} color="#FFA611" />
                        <div className="absolute -bottom-2 bg-[#FFA611] text-black px-4 py-1 rounded-full font-black text-sm">Backend</div>
                    </div>
                    <span className="text-2xl font-black text-white">Firebase</span>
                    <span className="text-slate-400 font-bold mt-2 text-center">Auth & Firestore DB<br/>(Serverless Cost)</span>
                </motion.div>

                <div className="text-slate-600 hidden md:block">
                     <span className="text-5xl">↔️</span>
                </div>

                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-slate-900 rounded-3xl border-2 border-[#4285F4] shadow-[0_0_30px_rgba(66,133,244,0.2)] flex items-center justify-center mb-6">
                        <BrainCircuit size={64} color="#4285F4" />
                    </div>
                    <span className="text-2xl font-black text-white">Gemini API</span>
                    <span className="text-slate-400 font-bold mt-2">عقل الذكاء الاصطناعي</span>
                </motion.div>
            </div>
            <p className="text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4 mt-16 w-full max-w-5xl">"بنية سحابية قابلة للتوسع الفوري (Scalable) وتكلفة خوادم شبه معدومة في البداية."</p>
        </div>,

        // 13. Business Model
        <div key="13" className="flex flex-col h-full items-center justify-center p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-12 w-full text-right w-full">12. نموذج الأعمال (Business Model)</motion.h2>
            
            <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                
                <h3 className="text-2xl font-bold text-slate-300 mb-8 border-b-2 border-slate-800 pb-4 inline-block">النموذج الهجين القابل للتوسع</h3>
                
                <div className="grid grid-cols-2 gap-12">
                     <div className="flex flex-col">
                          <div className="flex items-center gap-4 mb-6">
                               <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center"><Users size={28} /></div>
                               <h4 className="text-2xl font-black text-white">B2C (الأفراد)</h4>
                          </div>
                          <ul className="space-y-4">
                              <li className="flex items-start gap-3">
                                  <span className="text-emerald-500 mt-1">✔</span>
                                  <span className="text-slate-300 text-lg"><strong>Freemium:</strong> تعلم مجاني محدود لجلب مئات الآلاف للمنصة عضوياً.</span>
                              </li>
                              <li className="flex items-start gap-3">
                                  <span className="text-emerald-500 mt-1">✔</span>
                                  <span className="text-slate-300 text-lg"><strong>الاشتراك المدفوع:</strong> للوصول غير المحدود للمحادثة الصوتية (Voice AI) وراديو الذكاء الاصطناعي والمزرعة الكاملة.</span>
                              </li>
                          </ul>
                     </div>

                     <div className="flex flex-col border-r border-slate-800 pr-12">
                          <div className="flex items-center gap-4 mb-6">
                               <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center"><BookOpen size={28} /></div>
                               <h4 className="text-2xl font-black text-white">B2B (المؤسسات الأكاديمية)</h4>
                          </div>
                          <ul className="space-y-4">
                              <li className="flex items-start gap-3">
                                  <span className="text-emerald-500 mt-1">✔</span>
                                  <span className="text-slate-300 text-lg"><strong>استهداف منهجي:</strong> الجامعات والمعاهد الجزائرية كمرحلة أولى (مراكز التعليم المكثف للغات CEIL).</span>
                              </li>
                              <li className="flex items-start gap-3">
                                  <span className="text-emerald-500 mt-1">✔</span>
                                  <span className="text-slate-300 text-lg"><strong>تراخيص مجمعة:</strong> توفير Dashboard للمعلم لمتابعة تقدم مئات الطلاب في وقت واحد.</span>
                              </li>
                          </ul>
                     </div>
                </div>
            </div>
            <p className="text-xl text-emerald-400 font-bold border-r-4 border-emerald-400 pr-4 mt-8 w-full max-w-5xl">"دمجنا بين الانتشار الفيروسي المجاني، ومبيعات الاشتراكات، والرخص المؤسساتية المضمونة."</p>
        </div>,

        // 14. Financials
        <div key="14" className="flex flex-col h-full items-center justify-center p-8">
            <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black mb-12 w-full text-right w-full">13. المؤشرات المالية المذهلة</motion.h2>

            <div className="grid grid-cols-4 gap-6 w-full max-w-6xl">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                    <span className="text-5xl mb-4">📉</span>
                    <h4 className="text-4xl font-black text-emerald-400 mb-2">159 DZD</h4>
                    <span className="text-slate-300 font-bold">التكلفة التشغيلية (COGS)</span>
                    <span className="text-xs text-slate-500 mt-2">لكل مستخدم نشط سحابياً</span>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-slate-900 border-2 border-blue-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                    <span className="text-5xl mb-4">🎯</span>
                    <h4 className="text-4xl font-black text-blue-400 mb-2">10</h4>
                    <span className="text-slate-300 font-bold">مستخدمين للتعادل</span>
                    <span className="text-xs text-slate-500 mt-2">فقط للوصول لـ Break-Even</span>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-slate-900 border-2 border-purple-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                    <span className="text-5xl mb-4">🧲</span>
                    <h4 className="text-4xl font-black text-purple-400 mb-2">66 DZD</h4>
                    <span className="text-slate-300 font-bold">تكلفة الاستحواذ (CAC)</span>
                    <span className="text-xs text-slate-500 mt-2">بفضل التسويق العضوي للتطبيق</span>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_0_40px_rgba(245,158,11,0.5)] transform scale-110 z-10 border-4 border-slate-950">
                    <span className="text-5xl mb-4">🚀</span>
                    <h4 className="text-5xl font-black text-black mb-2">240:1</h4>
                    <span className="text-white font-black text-xl">معدل العائد (ROI)</span>
                    <span className="text-xs text-amber-100 mt-2 font-bold uppercase">قوة البرمجيات كخدمة (SaaS)</span>
                </motion.div>
            </div>
            
        </div>,

        // 15. Roadmap & Closing
        <div key="15" className="flex flex-col h-full items-center justify-center p-8 relative">
            <h2 className="text-4xl font-black mb-16 w-full text-right w-full z-10 text-emerald-400">خارطة الطريق والخاتمة</h2>
            
            <div className="w-full max-w-5xl flex flex-col z-10 mb-12">
                 <div className="flex items-center w-full justify-between relative">
                     <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-800 -translate-y-1/2 z-0"></div>
                     <div className="absolute top-1/2 right-8 w-[25%] h-1 bg-emerald-500 -translate-y-1/2 z-0"></div>
                     
                     {/* Phase 1 */}
                     <div className="bg-slate-900 border-2 border-emerald-500 w-48 h-48 rounded-full flex flex-col items-center justify-center z-10 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                         <span className="text-3xl mb-2">MVP</span>
                         <span className="font-bold text-slate-300 text-center text-sm px-4">إطلاق النموذج الأولي للاختبار</span>
                     </div>
                     {/* Phase 2 */}
                     <div className="bg-slate-900 border-2 border-slate-700 w-48 h-48 rounded-full flex flex-col items-center justify-center z-10">
                         <span className="text-3xl mb-2">Go-to-Market</span>
                         <span className="font-bold text-slate-500 text-center text-sm px-4">تغطية السوق الوطني والاستحواذ</span>
                     </div>
                     {/* Phase 3 */}
                     <div className="bg-slate-900 border-2 border-slate-700 w-48 h-48 rounded-full flex flex-col items-center justify-center z-10">
                         <span className="text-3xl mb-2">B2B</span>
                         <span className="font-bold text-slate-500 text-center text-sm px-4">الشراكات مع الجامعات</span>
                     </div>
                     {/* Phase 4 */}
                     <div className="bg-slate-900 border-2 border-slate-700 w-48 h-48 rounded-full flex flex-col items-center justify-center z-10">
                         <span className="text-3xl mb-2">MENA</span>
                         <span className="font-bold text-slate-500 text-center text-sm px-4">التوسع الإقليمي (الشرق الأوسط)</span>
                     </div>
                 </div>
            </div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-slate-800/80 backdrop-blur-md px-12 py-8 rounded-3xl border border-slate-700 text-center z-10">
                <span className="text-8xl block mb-6 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">🦊</span>
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">شكراً لكم. نطلب منحنا علامة (مشروع مبتكر).</p>
            </motion.div>
             <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[200px]"></div>
            </div>
        </div>
    ];

    return (
        <div className="fixed inset-0 z-[999] bg-slate-950 text-white flex flex-col overflow-hidden font-sans presentation-bg" dir="rtl">
            <style dangerouslySetInnerHTML={{__html: `
                .presentation-bg {
                    background-image: 
                        linear-gradient(to right, #0f172a 1px, transparent 1px),
                        linear-gradient(to bottom, #0f172a 1px, transparent 1px);
                    background-size: 40px 40px;
                    background-color: #020617;
                }
            `}} />
            
            {/* Top Bar Navigation Feedback */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none opacity-30">
                <div className="text-xs font-mono">{currentSlide + 1} / {totalSlides}</div>
                <div className="flex gap-2">
                    <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-xs">↑ Up</kbd>
                    <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-xs">↓ Down</kbd>
                    <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-xs text-rose-400 ml-4">Esc</kbd>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full h-full relative">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentSlide}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full"
                    >
                        {slides[currentSlide]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Invisible Mobile Tap zones for tablet/phone presentation */}
            <div className="absolute inset-0 z-40 flex opacity-0 cursor-pointer pointer-events-auto">
                <div className="w-1/3 h-full" onClick={prevSlide}></div>
                <div className="w-2/3 h-full" onClick={nextSlide}></div>
            </div>
        </div>
    );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map } from 'lucide-react';

interface MapIntroModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MapIntroModal({ isOpen, onClose }: MapIntroModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        className="bg-[#fcf9f2] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-amber-900/10"
                    >
                        <div className="bg-amber-900/5 p-8 flex flex-col items-center text-center border-b border-amber-900/10">
                            <div className="bg-white p-4 rounded-full shadow-inner mb-4 text-amber-700">
                                <Map className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-amber-900 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                                طريق اليوم
                            </h2>
                        </div>
                        
                        <div className="p-8 flex gap-6 items-start">
                            <div className="w-20 h-20 shrink-0 bg-amber-200 rounded-full border-4 border-white shadow-md overflow-hidden relative">
                                <div className="absolute inset-0 flex items-center justify-center text-amber-800 text-xl font-black">إيلي</div>
                            </div>
                            <div className="bg-white rounded-2xl p-5 text-amber-900 leading-relaxed font-medium shadow-sm border border-amber-100 relative">
                                <div className="absolute right-[-10px] top-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[10px] border-l-white"></div>
                                <p>
                                    يا بطل! إيلي وليث بحاجة إليك اليوم. لدينا 7 مهام. كل مهمة تفتح ما بعدها.
                                </p>
                                <p className="mt-4 font-bold text-amber-700">
                                    أكملها كلها لتحمي قريتنا!
                                </p>
                            </div>
                        </div>

                        <div className="p-6 pt-0">
                            <button 
                                onClick={onClose}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg transition-all"
                            >
                                فهمت، هيا بنا!
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

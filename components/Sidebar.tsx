
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuIcon, XIcon } from './icons';
import { useYuki } from './YukiGlobal';

interface SidebarProps {
    onSignOut: () => void;
    coins: number;
    onImportLesson: () => void;
    onUploadLesson: () => void;
    onExportLesson: () => void;
    onOpenTranslator: () => void;
    onChangeLanguage: () => void;
    onChangeLevel: () => void;
    onOpenFarm: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSignOut, coins, onImportLesson, onUploadLesson, onExportLesson, onOpenTranslator, onChangeLanguage, onChangeLevel, onOpenFarm }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTeacherModeOpen, setIsTeacherModeOpen] = useState(false);
    const { setShowShop } = useYuki();

    const toggleSidebar = () => setIsOpen(!isOpen);

    const menuItems = [
        { label: 'المزرعة (المراجعة الذكية)', icon: '🌿', action: onOpenFarm },
        { label: 'تغيير اللغة', icon: '🌍', action: onChangeLanguage },
        { label: 'تغيير المستوى', icon: '📈', action: onChangeLevel },
        { label: 'المترجم السريع (تشينغو)', icon: '✨', action: onOpenTranslator },
        { label: 'استيراد درس', icon: '📥', action: onImportLesson },
        { label: 'رفع درس', icon: '📤', action: onUploadLesson },
        { label: 'مشاركة درس', icon: '🔗', action: onExportLesson },
    ];

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 right-4 z-[70] p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 text-purple-600 hover:text-purple-600 transition-all active:scale-95"
                aria-label="Toggle Menu"
            >
                <MenuIcon className="w-6 h-6" />
            </button>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleSidebar}
                            className="fixed inset-0 bg-purple-900/40 backdrop-blur-[2px] z-[80]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-[90] flex flex-col p-6 border-l border-purple-50"
                            dir="rtl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-purple-800 font-cafe">القائمة</h2>
                                <button onClick={toggleSidebar} className="p-2 hover:bg-purple-50 rounded-full transition-colors">
                                    <XIcon className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 flex-grow">
                                {/* Coins Display */}
                                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🪙</span>
                                        <span className="font-bold text-yellow-700">رصيدك</span>
                                    </div>
                                    <span className="text-xl font-black text-yellow-800">{coins}</span>
                                </div>

                                {/* Shop Button */}
                                <button
                                    onClick={() => {
                                        setShowShop(true);
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl transition-all group"
                                >
                                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                                        <span className="text-xl">👕</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">متجر يوكي</div>
                                        <div className="text-xs opacity-70">غير مظهر رفيقتك</div>
                                    </div>
                                </button>

                                {/* Lesson Actions */}
                                <div className="mt-4 pt-4 border-t border-purple-50 flex flex-col gap-2">
                                    {menuItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { item.action(); setIsOpen(false); }}
                                            className="flex items-center gap-4 p-3 hover:bg-white rounded-xl text-purple-700 font-bold transition-colors"
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sign Out Button */}
                            <button
                                onClick={() => {
                                    onSignOut();
                                    setIsOpen(false);
                                }}
                                className="mt-auto flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all font-bold border border-red-100"
                            >
                                <span>تسجيل الخروج</span>
                                <span className="text-xl">🚪</span>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;

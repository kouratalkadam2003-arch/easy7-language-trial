import React from 'react';
import { Map, Tent, Play, Layers, Radio } from 'lucide-react';

interface BottomNavProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#FDF8F5] border-t border-[#E8DCC8] px-4 py-2 flex justify-between items-center z-[50] pb-safe" dir="rtl">
            <button 
                onClick={() => onTabChange('farm')}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentTab === 'farm' ? 'text-[#5D4037]' : 'text-[#A68A77] hover:text-[#7A5C4D]'}`}
            >
                <Tent size={24} strokeWidth={currentTab === 'farm' ? 2.5 : 2} />
                <span className="text-[10px] font-bold">القرية</span>
            </button>
            
            <button 
                onClick={() => onTabChange('map')}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentTab === 'map' ? 'text-[#5D4037]' : 'text-[#A68A77] hover:text-[#7A5C4D]'}`}
            >
                <Map size={24} strokeWidth={currentTab === 'map' ? 2.5 : 2} />
                <span className="text-[10px] font-bold">الخريطة</span>
            </button>

            <div className="relative -top-5">
                <button 
                    onClick={() => onTabChange('play')}
                    className="flex items-center justify-center w-16 h-16 bg-[#5D4037] border-4 border-[#FDF8F5] rounded-full shadow-lg text-[#FDF8F5] hover:scale-105 active:scale-95 transition-all"
                >
                    <Play size={28} fill="currentColor" className="ml-1" />
                </button>
            </div>

            <button 
                onClick={() => onTabChange('cards')}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentTab === 'cards' ? 'text-[#5D4037]' : 'text-[#A68A77] hover:text-[#7A5C4D]'}`}
            >
                <Layers size={24} strokeWidth={currentTab === 'cards' ? 2.5 : 2} />
                <span className="text-[10px] font-bold">بطاقات</span>
            </button>

            <button 
                onClick={() => onTabChange('radio')}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentTab === 'radio' ? 'text-[#5D4037]' : 'text-[#A68A77] hover:text-[#7A5C4D]'}`}
            >
                <Radio size={24} strokeWidth={currentTab === 'radio' ? 2.5 : 2} />
                <span className="text-[10px] font-bold">الراديو</span>
            </button>
        </div>
    );
};

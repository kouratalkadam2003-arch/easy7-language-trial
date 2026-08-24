import React from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveScreen from '../components/InteractiveScreen';

export default function AiChatInterface() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full font-sans flex flex-col relative overflow-hidden bg-slate-50">
      
      {/* Main Container */}
      <div className="flex-1 relative bg-white flex flex-col shadow-sm max-w-2xl mx-auto w-full">
        
        {/* Top Header - Voice-to-Voice Chat */}
        <div className="pt-8 px-6 w-full mx-auto flex flex-col items-center relative z-20 border-b border-slate-100 pb-6">
          <div className="bg-white border-2 border-emerald-100 rounded-2xl px-6 py-3 flex items-center justify-center gap-3 shadow-sm w-max mb-4">
             <img src="https://api.dicebear.com/7.x/bottts/svg?seed=farmSheep&backgroundColor=transparent" alt="Sheep" className="w-10 h-10 drop-shadow-sm rounded-full bg-slate-50" />
             <h1 className="text-slate-800 font-bold text-xl drop-shadow-sm font-nunito tracking-tight">Voice-to-Voice Chat</h1>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs mt-2 mb-2">
            <div className="w-full h-3 bg-slate-100 rounded-full relative overflow-visible shadow-inner">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 w-[60%] shadow-sm">
              </div>
            </div>
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-3">Level 3: Farm Phrases</p>
        </div>

        {/* Central Character & Speaking Bubbles */}
        <div className="flex-1 overflow-y-auto px-4 pb-32 flex flex-col z-20 no-scrollbar pt-6">
          
          <div className="w-full flex flex-col items-center justify-center my-6 relative">
            <div className="absolute w-40 h-40 rounded-full bg-emerald-400 blur-3xl opacity-10 animate-pulse"></div>
            <div className="relative w-32 h-32 rounded-full border-4 border-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.2)] flex items-center justify-center bg-white">
               <img src="https://api.dicebear.com/7.x/fun-emoji/svg?seed=sheepFarm&backgroundColor=transparent" alt="Sheep Avatar" className="w-24 h-24 drop-shadow-sm" />
            </div>
            
            {/* Sheep Speaking Bubble */}
            <div className="absolute right-0 sm:right-8 lg:right-24 bottom-0 transform translate-y-1/4">
               <div className="bg-emerald-500 border border-emerald-600 rounded-2xl p-4 shadow-md relative">
                 <div className="absolute bottom-full right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-emerald-600"></div>
                 <div className="absolute bottom-full right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-emerald-500 translate-y-[2px]"></div>
                 <p className="text-emerald-50 font-bold text-xs uppercase tracking-wider mb-1">Speaking:</p>
                 <p className="text-white font-medium text-sm">Can I have...</p>
               </div>
            </div>
          </div>

          <p className="text-center font-bold text-slate-400 mb-8 text-sm uppercase tracking-widest mt-4">Yuki is listening...</p>

          {/* Chat Bubbles */}
          <div className="flex flex-col w-full max-w-md mx-auto gap-4">
             {/* Left Bubble (Yuki) */}
             <div className="self-start max-w-[80%] bg-emerald-50 border border-emerald-100 p-4 rounded-3xl rounded-tl-sm shadow-sm relative">
                <p className="text-slate-800 font-bold mb-1 text-lg">你好! (Nǐ hǎo!)</p>
                <p className="text-slate-500 text-sm">How can I help you today?</p>
             </div>

             {/* Right Bubble (User) */}
             <div className="self-end max-w-[80%] bg-white border border-slate-200 p-4 rounded-3xl rounded-tr-sm shadow-sm relative">
                <p className="text-slate-700 text-base">I would like to practice ordering food at the market.</p>
             </div>
          </div>

          {/* Sound Wave Graphic */}
          <div className="w-full flex justify-center items-center mt-12 mb-4 h-16 opacity-50">
            <svg viewBox="0 0 200 40" className="w-full max-w-sm h-full" preserveAspectRatio="none">
              <path d="M0,20 Q20,10 40,20 T80,20 T120,20 T160,20 T200,20" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.3" />
              <path d="M0,20 Q20,15 40,20 T80,20 T120,20 T160,20 T200,20" fill="none" stroke="#059669" strokeWidth="3" opacity="0.5" />
              <circle cx="20" cy="15" r="3" fill="#10b981" />
              <circle cx="60" cy="25" r="2" fill="#059669" />
              <circle cx="100" cy="10" r="3" fill="#10b981" />
              <circle cx="140" cy="28" r="2" fill="#047857" />
              <circle cx="180" cy="12" r="3" fill="#059669" />
            </svg>
          </div>

        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center z-20">
          <div className="bg-white border border-slate-200 rounded-full flex items-center shadow-lg overflow-hidden w-full max-w-xs transition-all hover:shadow-xl">
            <button className="flex-1 py-4 px-4 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors border-r border-slate-100 text-slate-600">
              <span className="material-symbols-outlined">mic_off</span>
              <span className="font-bold text-sm">Mute</span>
            </button>
            <button onClick={() => navigate('/AdventureMapPath')} className="flex-1 py-4 px-4 flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors text-rose-500">
              <span className="font-bold text-sm">End Chat</span>
              <span className="material-symbols-outlined text-base">phone_missed</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

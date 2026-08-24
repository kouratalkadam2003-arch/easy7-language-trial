import React from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveScreen from '../components/InteractiveScreen';

export default function InteractiveVocabularyFlashcards() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full font-sans flex flex-col relative overflow-hidden bg-slate-50">
      
      {/* Top Progress Bar */}
      <div className="pt-12 px-6 w-full max-w-xl mx-auto z-10 flex flex-col items-center">
        <div className="relative w-full max-w-xs mt-6 mb-8 group">
          <div className="absolute -top-6 -left-2 bg-indigo-500 rounded-md px-2 py-1 text-xs font-bold text-white shadow-sm transform -rotate-2 z-10">
            Level 1
          </div>
          {/* Bar background */}
          <div className="w-full h-3 bg-slate-200 rounded-full relative overflow-visible shadow-inner">
            {/* Fill */}
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500 w-[40%] relative">
               <div className="absolute top-0.5 left-1 right-1 h-1 bg-white/30 rounded-full"></div>
            </div>
            {/* Percentage */}
            <div className="absolute -top-6 right-0 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              40%
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 w-full max-w-xl mx-auto mb-32">
        
        {/* Flashcard */}
        <div className="w-full max-w-xs aspect-[3/4] bg-white rounded-3xl shadow-lg border border-slate-100 p-8 relative cursor-pointer transform transition-transform hover:scale-105 active:scale-95 flex flex-col justify-center items-center gap-8">
          
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center shadow-inner">
              <img src="https://api.dicebear.com/7.x/icons/svg?icon=apple&backgroundColor=transparent" alt="Apple" className="w-12 h-12 filter drop-shadow-sm brightness-110 saturate-150 hue-rotate-15" />
          </div>
          
          <div className="text-center">
            <h2 className="text-4xl text-slate-800 font-extrabold tracking-tight font-nunito mb-2">
              Pomme
            </h2>
            <p className="text-slate-400 font-medium">Apple</p>
          </div>
          
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <span className="text-xs text-slate-300 uppercase tracking-widest font-bold flex items-center gap-1">
              Tap to flip
            </span>
          </div>
        </div>

        {/* Rating Buttons */}
        <div className="w-full px-2 mt-12 grid grid-cols-4 gap-3 max-w-md">
          {/* Hard */}
          <button className="bg-rose-100 rounded-2xl pb-1 shadow-sm active:pb-0 active:mt-1 transition-all">
            <div className="bg-rose-50 rounded-2xl p-3 flex flex-col items-center justify-center h-full border border-rose-200 gap-1 text-rose-500">
              <span className="material-symbols-outlined text-2xl">heart_broken</span>
              <span className="font-bold text-[10px] uppercase tracking-wider">Hard</span>
            </div>
          </button>
          
          {/* Okay */}
          <button className="bg-amber-100 rounded-2xl pb-1 shadow-sm active:pb-0 active:mt-1 transition-all">
            <div className="bg-amber-50 rounded-2xl p-3 flex flex-col items-center justify-center h-full border border-amber-200 gap-1 text-amber-500">
               <span className="material-symbols-outlined text-2xl">thumb_up</span>
               <span className="font-bold text-[10px] uppercase tracking-wider">Okay</span>
            </div>
          </button>

          {/* Good */}
          <button className="bg-emerald-100 rounded-2xl pb-1 shadow-sm active:pb-0 active:mt-1 transition-all">
             <div className="bg-emerald-50 rounded-2xl p-3 flex flex-col items-center justify-center h-full border border-emerald-200 gap-1 text-emerald-500">
               <span className="material-symbols-outlined text-2xl">check_box</span>
               <span className="font-bold text-[10px] uppercase tracking-wider">Good</span>
             </div>
          </button>

          {/* Perfect */}
          <button className="bg-indigo-100 rounded-2xl pb-1 shadow-sm active:pb-0 active:mt-1 transition-all">
             <div className="bg-indigo-50 rounded-2xl p-3 flex flex-col items-center justify-center h-full border border-indigo-200 gap-1 text-indigo-500">
               <span className="material-symbols-outlined text-2xl">star</span>
               <span className="font-bold text-[10px] uppercase tracking-wider">Perfect</span>
             </div>
          </button>
        </div>

      </div>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-50 rounded-t-3xl">
        <div className="flex justify-around items-end pt-3 pb-6 max-w-xl mx-auto">
          <button onClick={() => navigate('/AdventureMapPath')} className="flex flex-col items-center justify-center -translate-y-4 shadow-lg bg-indigo-500 rounded-2xl px-5 py-3 text-white transition-transform active:scale-95">
            <span className="material-symbols-outlined text-2xl mb-1" style={{fontVariationSettings: "'FILL' 1"}}>home</span>
            <span className="font-bold text-[10px] uppercase">Home</span>
          </button>
          
          <button onClick={() => navigate('/VocabularyBank')} className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-800 transition-colors pb-2">
            <span className="material-symbols-outlined text-2xl mb-1">book</span>
            <span className="font-bold text-[10px] uppercase">Library</span>
          </button>

          <button onClick={() => navigate('/FarmSupplyShop')} className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-800 transition-colors pb-2">
           <span className="material-symbols-outlined text-2xl mb-1">storefront</span>
           <span className="font-bold text-[10px] uppercase">Store</span>
          </button>
          
          <button onClick={() => navigate('/AccountAppSettings')} className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-800 transition-colors pb-2">
            <span className="material-symbols-outlined text-2xl mb-1">person</span>
            <span className="font-bold text-[10px] uppercase">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

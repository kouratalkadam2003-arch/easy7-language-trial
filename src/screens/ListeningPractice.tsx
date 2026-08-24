import React from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveScreen from '../components/InteractiveScreen';

export default function ListeningPractice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full font-sans flex flex-col relative overflow-hidden bg-slate-50">
      
      {/* Main Container */}
      <div className="flex-1 p-4 relative bg-slate-50 flex flex-col items-center gap-4 z-20 max-w-2xl mx-auto w-full">
        
        {/* Top Header - Interactive Listening Stage */}
        <div className="w-full max-w-md flex flex-col items-center relative z-20 mt-4">
          <div className="bg-indigo-500 rounded-full px-6 py-2 shadow-sm z-10 w-max mb-4">
             <h1 className="text-white font-bold text-center text-sm tracking-wide uppercase">Interactive Listening</h1>
          </div>
          
          {/* Top Image Board */}
          <div className="w-full bg-white p-2 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
             <img src="https://api.dicebear.com/7.x/identicon/svg?seed=farmLandscape1&backgroundColor=transparent" alt="Farm Landscape" className="w-full h-32 object-cover rounded-xl opacity-90" />
          </div>
        </div>

        {/* Content Board */}
        <div className="w-full max-w-md flex-1 bg-white mt-2 mb-2 p-6 rounded-3xl border border-slate-200 shadow-sm relative flex flex-col">

           {/* Dialogue Bubbles */}
           <div className="flex-1 flex flex-col gap-6 py-4">
              
              <div className="flex items-start gap-3">
                 <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl rounded-tl-sm shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex-1">
                   <p className="text-slate-800 font-bold mb-2">Bonjour, <span className="bg-indigo-50 text-indigo-700 rounded px-1">comment vas-tu ?</span></p>
                   <p className="text-slate-400 font-medium text-sm">Hello, how are you?</p>
                 </div>
                 <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 hover:bg-slate-50 text-indigo-500 mt-2">
                    <span className="material-symbols-outlined text-sm">translate</span>
                 </button>
              </div>

              <div className="flex flex-row-reverse items-start gap-3">
                 <div className="bg-indigo-500 border border-indigo-600 p-4 rounded-3xl rounded-tr-sm shadow-[0_2px_10px_rgba(99,102,241,0.2)] flex-1 text-right">
                   <p className="text-white font-bold">Je vais bien, et toi ?</p>
                 </div>
                 <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 hover:bg-slate-50 text-indigo-500 mt-2">
                    <span className="material-symbols-outlined text-sm">translate</span>
                 </button>
              </div>

              <div className="flex items-start gap-3">
                 <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl rounded-tl-sm shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex-1">
                   <p className="text-slate-800 font-bold mb-2">Très bien, merci !</p>
                   <p className="text-slate-400 font-medium text-sm">Very well, thank you!</p>
                 </div>
                 <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 hover:bg-slate-50 text-indigo-500 mt-2">
                    <span className="material-symbols-outlined text-sm">translate</span>
                 </button>
              </div>

           </div>

           {/* Controls at bottom of paper */}
           <div className="flex justify-between items-end mt-6 pt-6 border-t border-slate-100">
              <div className="flex flex-col gap-2">
                 <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Listen Full</span>
                 <button className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 transition-transform text-white">
                    <span className="material-symbols-outlined text-3xl">play_arrow</span>
                 </button>
              </div>

              <div className="flex flex-col items-end gap-2">
                 <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Speed</span>
                 <div className="w-32 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center p-1 relative shadow-inner">
                    <div className="w-16 h-full bg-white rounded-full shadow-sm"></div>
                    {/* Slider thumb */}
                    <div className="w-8 h-8 rounded-full bg-white shadow-md absolute left-10 flex items-center justify-center text-indigo-500 border border-slate-100">
                        <span className="text-[10px] font-bold">1x</span>
                    </div>
                 </div>
                 <div className="w-32 flex justify-between text-[10px] text-slate-300 font-bold px-2">
                    <span>0.5x</span>
                    <span>1.5x</span>
                 </div>
              </div>
           </div>

        </div>

        {/* Action Button */}
        <button onClick={() => navigate('/AdventureMapPath')} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-10 rounded-2xl shadow-[0_6px_0_0_#4338ca] active:translate-y-1.5 active:shadow-none transition-all flex items-center gap-3 mb-6 z-20 w-full max-w-md justify-center">
            Continuer
            <span className="material-symbols-outlined">arrow_forward</span>
        </button>

      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, Lightbulb, Volume2, ChevronRight, Check } from 'lucide-react';

export default function InteractiveLanguageQuizStage() {
  const navigate = useNavigate();
  return (
    <div className="w-full min-h-screen bg-slate-50 m-0 p-0 overflow-x-hidden flex flex-col font-sans select-none">
      
      {/* Top App Bar Area */}
      <header className="border-b border-slate-100 bg-white py-4 px-6 shrink-0 relative z-40 shadow-sm animate-fade-in">
        <div className="max-w-5xl mx-auto flex justify-between items-center w-full">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            <X size={20} className="text-slate-600" />
          </button>
          
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="w-24 h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
               <div className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full w-3/4" />
            </div>
            <span className="font-bold text-slate-500 text-xs">3 of 4</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 rounded-xl px-3 py-1.5 shadow-sm">
            <Heart size={16} fill="#E11D48" color="#E11D48" />
            <span className="font-extrabold text-rose-600 text-sm">5</span>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 flex flex-col items-center justify-center relative z-10">
        
        {/* Question Bubble */}
        <div className="w-full max-w-2xl bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative mb-8 flex flex-col items-center">
          <span className="text-xs font-bold text-emerald-600 block uppercase tracking-wider mb-2">Quiz Practice</span>
          <p className="text-3xl font-black text-slate-800 text-center leading-relaxed font-nunito">
            <span className="inline-block border-b-[3px] border-emerald-500 w-20 mb-[-4px] mr-2"></span> はおいしいです。
          </p>
          <p className="text-slate-500 font-semibold mt-3 text-lg leading-relaxed text-center">
            (_____ is delicious)
          </p>
        </div>
        
        {/* Answer Options (Bento Grid Style) */}
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <button onClick={() => navigate('/AdventureMapPath')} className="bg-white rounded-2xl p-5 text-left border border-slate-100 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/10 flex items-center gap-4 transition-all duration-150">
            <div className="bg-slate-50 border border-slate-200 rounded-xl w-10 h-10 flex items-center justify-center font-extrabold text-slate-600 text-lg">A</div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-700 text-xl font-nunito">りんご</span>
              <span className="font-bold text-slate-400 text-sm">(Apple)</span>
            </div>
          </button>
          
          <button onClick={() => navigate('/AdventureMapPath')} className="bg-white rounded-2xl p-5 text-left border border-slate-100 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/10 flex items-center gap-4 transition-all duration-150">
            <div className="bg-slate-50 border border-slate-200 rounded-xl w-10 h-10 flex items-center justify-center font-extrabold text-slate-600 text-lg">B</div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-700 text-xl font-nunito">つくえ</span>
              <span className="font-bold text-slate-400 text-sm">(Desk)</span>
            </div>
          </button>
          
          <button onClick={() => navigate('/AdventureMapPath')} className="bg-white rounded-2xl p-5 text-left border border-slate-100 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/10 flex items-center gap-4 transition-all duration-150">
            <div className="bg-slate-50 border border-slate-200 rounded-xl w-10 h-10 flex items-center justify-center font-extrabold text-slate-600 text-lg">C</div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-700 text-xl font-nunito">えんぴつ</span>
              <span className="font-bold text-slate-400 text-sm">(Pencil)</span>
            </div>
          </button>
          
          <button onClick={() => navigate('/AdventureMapPath')} className="bg-white rounded-2xl p-5 text-left border border-slate-100 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/10 flex items-center gap-4 transition-all duration-150">
            <div className="bg-slate-50 border border-slate-200 rounded-xl w-10 h-10 flex items-center justify-center font-extrabold text-slate-600 text-lg">D</div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-700 text-xl font-nunito">いぬ</span>
              <span className="font-bold text-slate-400 text-sm">(Dog)</span>
            </div>
          </button>
        </div>
        
        {/* Helper Action Buttons */}
        <div className="w-full max-w-2xl flex justify-between mt-10 gap-4">
          <button className="flex-1 bg-white hover:bg-slate-50 rounded-2xl py-4 border border-slate-100 shadow-sm flex items-center justify-center gap-2 transition-all">
            <Lightbulb size={18} className="text-amber-500" />
            <span className="font-extrabold text-slate-600 font-nunito">Explore Hint</span>
          </button>
          <button className="flex-1 bg-white hover:bg-slate-50 rounded-2xl py-4 border border-slate-100 shadow-sm flex items-center justify-center gap-2 transition-all">
            <Volume2 size={18} className="text-emerald-500" />
            <span className="font-extrabold text-slate-600 font-nunito">Hear Audio</span>
          </button>
        </div>
        
        {/* Next Button Action */}
        <div className="w-full max-w-2xl mt-12 mb-6">
           <button 
              onClick={() => navigate('/AdventureMapPath')}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-nunito text-lg font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
           >
              <span>Continue Lesson</span>
              <ChevronRight size={20} />
           </button>
        </div>
        
      </main>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  Map, 
  Users, 
  ShoppingCart, 
  User, 
  Flame,
  BatteryFull,
  Signal,
  Wifi,
  Compass,
  MapPin,
  Home
} from 'lucide-react';

export default function AdventureMapPath() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-slate-50 m-0 p-0 overflow-x-hidden flex flex-col font-sans select-none">
      
      {/* Top App Bar */}
      <header className="border-b border-slate-100 bg-white py-4 px-6 shrink-0 relative z-40 shadow-sm animate-fade-in">
        <div className="max-w-5xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Compass className="text-emerald-500 w-8 h-8" />
            <div>
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Learning Pathway</span>
              <span className="text-sm font-black text-slate-700 font-nunito leading-tight">Adventure Map</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex-grow bg-slate-200 h-2.5 rounded-full w-24 overflow-hidden relative shadow-inner">
               <div className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full w-[65%]" />
            </div>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            <div className="flex items-center gap-1">
              <Flame fill="#FF7043" color="#FF7043" size={16} />
              <span className="font-bold text-slate-700 text-sm">Streak 12</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center relative z-10">
        
        {/* Map Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight font-nunito mb-1">Select a Lesson</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Follow paths/quests and level up the garden</p>
        </div>

        {/* Scenic Center Pathway Display */}
        <div className="bg-white border border-slate-100 rounded-[32px] shadow-md max-w-md w-full relative overflow-hidden h-[600px] flex flex-col self-center">
          
          {/* Aesthetic background items */}
          <div className="absolute top-[8%] left-[8%] text-4xl opacity-80 select-none pointer-events-none">🌳</div>
          <div className="absolute top-[5%] right-[10%] text-4xl opacity-80 select-none pointer-events-none">🌳</div>
          <div className="absolute top-[40%] right-[5%] text-5xl opacity-80 select-none pointer-events-none">🛖</div>
          <div className="absolute top-[68%] left-[4%] text-4xl opacity-80 select-none pointer-events-none">⛰️</div>
          <div className="absolute top-[75%] right-[10%] text-4xl opacity-80 select-none pointer-events-none">🌲</div>

          {/* Map background SVG */}
          <div className="absolute inset-0 z-0 select-none pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 375 600">
              <path d="M 180 -20 C 280 80, 280 180, 150 280 C 20 380, 20 500, 160 550 C 210 580, 190 620, 100 650" fill="none" stroke="#F1F5F9" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 180 -20 C 280 80, 280 180, 150 280 C 20 380, 20 500, 160 550 C 210 580, 190 620, 100 650" fill="none" stroke="#E2E8F0" strokeWidth="50" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14 10" />
            </svg>
          </div>

          {/* Level Nodes on Route */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            
            {/* Level 4 (Top) */}
            <div className="absolute top-[12%] left-[45%] flex flex-col items-center pointer-events-auto cursor-pointer group" onClick={() => navigate('/InteractiveLanguageQuizStage')}>
               <div className="relative mr-[-100px] flex flex-col items-center pb-2 mb-[-10px]">
                  <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm text-slate-700 font-extrabold text-xs">
                    1. 森 (Forest)
                  </div>
               </div>
               
               <div className="relative flex flex-col items-center">
                 <div className="w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white shadow-md group-hover:scale-125 transition-transform"></div>
               </div>
            </div>

            {/* Level 3 */}
            <div className="absolute top-[32%] left-[25%] flex items-end pointer-events-auto cursor-pointer group" onClick={() => navigate('/InteractiveLanguageQuizStage')}>
               <div className="relative mr-2 flex flex-col items-center pb-2">
                  <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm text-slate-700 font-extrabold text-xs">
                    2. 村 (Village)
                  </div>
               </div>
               
               <div className="flex flex-col items-center relative">
                 <div className="w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white shadow-md group-hover:scale-125 transition-transform"></div>
               </div>
            </div>

            {/* Level 2 (Current) */}
            <div className="absolute top-[55%] left-[45%] flex items-end pointer-events-auto cursor-pointer group" onClick={() => navigate('/InteractiveLanguageQuizStage')}>
               <div className="relative mr-2 flex flex-col items-center pb-2">
                  <div className="bg-white border border-emerald-400 bg-emerald-50 px-3 py-1.5 rounded-xl shadow-sm text-emerald-800 font-black text-xs">
                    3. 山 (Mountain)
                  </div>
               </div>
               
               <div className="flex flex-col items-center relative">
                 {/* Tooltip */}
                 <div className="absolute -top-16 bg-slate-800 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap z-20">
                   Active Variant 3 of 10
                 </div>
                 
                 {/* Avatar */}
                 <div className="absolute -top-10 z-20 flex flex-col items-center group-hover:-translate-y-1 transition-transform">
                   <div className="w-10 h-10 bg-rose-50 rounded-full border-[2px] border-rose-500 overflow-hidden flex items-end justify-center shadow-md">
                      <span className="text-3xl translate-y-1">👧🏼</span>
                   </div>
                   <div className="w-10 h-2 bg-rose-500/20 rounded-full absolute -bottom-1 -z-10 blur-[1px]"></div>
                 </div>

                 <div className="w-5 h-5 bg-rose-500 rounded-full border-[3px] border-white shadow-md"></div>
               </div>
            </div>

            {/* Level 1 (Bottom) */}
            <div className="absolute top-[78%] left-[25%] flex items-end pointer-events-auto cursor-pointer group" onClick={() => navigate('/InteractiveLanguageQuizStage')}>
               <div className="relative mr-2 flex flex-col items-center pb-2">
                  <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm text-slate-700 font-extrabold text-xs">
                    4. 川 (River)
                  </div>
               </div>
               
               <div className="flex flex-col items-center relative">
                 <div className="w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white shadow-md group-hover:scale-125 transition-transform"></div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="border-t border-slate-100 bg-white py-3 px-6 shrink-0 mt-auto">
        <div className="max-w-5xl mx-auto flex justify-between items-center w-full">
          <button onClick={() => navigate('/SrsWordFarmDashboard')} className="flex flex-col items-center text-slate-400 hover:text-emerald-500 group w-1/5 transition-colors">
            <Sprout className="w-6 h-6 mb-1" strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Farm</span>
          </button>
          
          <button onClick={() => navigate('/AdventureMapPath')} className="flex flex-col items-center text-emerald-500 group w-1/5">
            <Map className="w-6 h-6 mb-1" strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Lessons</span>
          </button>
          
          <button onClick={() => navigate('/GlobalRankings')} className="flex flex-col items-center text-slate-400 hover:text-emerald-500 group w-1/5 transition-colors">
            <Users className="w-6 h-6 mb-1" strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Community</span>
          </button>
          
          <button onClick={() => navigate('/FarmSupplyShop')} className="flex flex-col items-center text-slate-400 hover:text-emerald-500 group w-1/5 transition-colors">
            <ShoppingCart className="w-6 h-6 mb-1" strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Shop</span>
          </button>
          
          <button onClick={() => navigate('/EditProfile')} className="flex flex-col items-center text-slate-400 hover:text-emerald-500 group w-1/5 transition-colors">
            <User className="w-6 h-6 mb-1" strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </div>
      </footer>

    </div>
  );
}

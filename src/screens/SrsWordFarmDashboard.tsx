import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  Map, 
  Users, 
  ShoppingCart, 
  User, 
  Flame,
  HelpCircle,
  Gem,
  CloudRain,
  TreePine,
  TreeDeciduous,
  Leaf
} from 'lucide-react';
import { VillageEngine } from '@/components/village/VillageEngine';
import GoblinFightGame from '@/screens/ZombieFightGame';
import { useArmyStore } from '@/store/armyStore';

export default function SrsWordFarmDashboard() {
  const navigate = useNavigate();
  const [showBattle, setShowBattle] = useState(false);
  const troops = useArmyStore(s => s.troops);

  return (
    <div className="w-full min-h-screen bg-slate-50 m-0 p-0 overflow-x-hidden flex flex-col font-sans select-none">
      
      {/* Top App Bar */}
      <header className="border-b border-slate-100 bg-white py-4 px-6 shrink-0 relative z-40 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/EditProfile')}
              className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shadow-sm overflow-hidden hover:bg-slate-200 transition-colors"
            >
              <User size={20} className="text-slate-600" />
            </button>
            <div className="text-left">
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">My Garden</span>
              <span className="text-sm font-black text-slate-700 font-nunito leading-tight">Farmer's Lounge</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-1">
              <Flame fill="#E17055" color="#E17055" size={16} />
              <span className="font-bold text-[#E17055] text-sm">120</span>
            </div>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-emerald-600 text-sm">500</span>
              <Gem fill="#10B981" color="#10B981" size={15} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area: Village Engine */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col relative z-10 overflow-hidden">
        {/* Full-bleed village map container */}
        <div className="absolute inset-0 w-full h-full">
          <VillageEngine />
        </div>

        {/* Floating UI over the village */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-40">
          <button 
            onClick={() => setShowBattle(true)}
            className="pointer-events-auto bg-red-600/90 text-white backdrop-blur-md border border-red-800 px-6 py-3 rounded-full shadow-[0_4px_12px_rgba(220,38,38,0.5)] flex items-center gap-3 active:scale-95 transition-transform"
          >
            <span className="text-xl">⚔️</span>
            <p className="font-extrabold font-nunito text-sm uppercase tracking-wide">
              Defend Village
            </p>
          </button>
        </div>
        
        {/* The Battle Overlay */}
        {showBattle && (
          <div className="absolute inset-0 z-50 bg-black">
            <GoblinFightGame 
              flashcards={troops} 
              onClose={() => setShowBattle(false)} 
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="border-t border-slate-100 bg-white py-3 px-6 shrink-0 mt-auto">
        <div className="max-w-5xl mx-auto flex justify-between items-center w-full">
          {/* Active Tab: Farm */}
          <button onClick={() => navigate('/SrsWordFarmDashboard')} className="flex flex-col items-center text-emerald-500 group w-1/5 transition-colors">
            <Sprout className="w-6 h-6 mb-1" strokeWidth={2.5} />
            <span className="text-[10px] font-bold">Farm</span>
          </button>
          
          <button onClick={() => navigate('/AdventureMapPath')} className="flex flex-col items-center text-slate-400 hover:text-emerald-500 group w-1/5 transition-colors">
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

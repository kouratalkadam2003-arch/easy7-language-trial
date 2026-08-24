import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  Map, 
  Users, 
  ShoppingCart, 
  User, 
  Flame,
  Globe
} from 'lucide-react';

export default function LanguageSelectionScreen() {
  const navigate = useNavigate();

  const handleLanguageSelect = (lang: string) => {
    navigate('/LoginScreen');
  };

  return (
    <div 
      className="w-full min-h-screen m-0 p-0 overflow-x-hidden flex flex-col font-sans select-none bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/language_select_bg.jpg')" }}
    >
      {/* Top App Bar */}
      <header className="border-b border-white/20 bg-white/75 backdrop-blur-md py-6 px-6 shrink-0 shadow-sm relative z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Globe className="text-emerald-600 w-8 h-8 animate-pulse" />
            <span className="text-2xl font-black text-slate-800 uppercase tracking-tight font-nunito">Language Selector</span>
          </div>
          
          <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-xl border border-white/30 shadow-sm relative">
            <div className="flex items-center gap-1">
              <Flame fill="#E17055" color="#E17055" size={16} />
              <span className="font-bold text-slate-700 text-sm">120</span>
            </div>
            <span className="w-[1px] h-4 bg-slate-200"></span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-emerald-600 text-xs">💎 500</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl px-2 mb-20">
          {/* Japanese */}
          <button 
            onClick={() => handleLanguageSelect('Japanese')} 
            className="relative aspect-square group rounded-3xl overflow-hidden border-2 border-white/45 shadow-md hover:shadow-2xl hover:border-emerald-400 active:scale-95 hover:scale-105 transition-all duration-300 flex flex-col justify-end p-4"
          >
            <img 
              src="/japanese_lang.jpg" 
              alt="Japanese" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
            <div className="relative z-10 w-full flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/95 text-slate-800 text-sm font-black shadow-md border border-slate-100 font-nunito group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                <span className="text-lg">🇯🇵</span>
                <span>Japanese</span>
              </span>
            </div>
          </button>

          {/* German */}
          <button 
            onClick={() => handleLanguageSelect('German')} 
            className="relative aspect-square group rounded-3xl overflow-hidden border-2 border-white/45 shadow-md hover:shadow-2xl hover:border-emerald-400 active:scale-95 hover:scale-105 transition-all duration-300 flex flex-col justify-end p-4"
          >
            <img 
              src="/german_lang.jpg" 
              alt="German" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
            <div className="relative z-10 w-full flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/95 text-slate-800 text-sm font-black shadow-md border border-slate-100 font-nunito group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                <span className="text-lg">🇩🇪</span>
                <span>German</span>
              </span>
            </div>
          </button>

          {/* French */}
          <button 
            onClick={() => handleLanguageSelect('French')} 
            className="relative aspect-square group rounded-3xl overflow-hidden border-2 border-white/45 shadow-md hover:shadow-2xl hover:border-emerald-400 active:scale-95 hover:scale-105 transition-all duration-300 flex flex-col justify-end p-4"
          >
            <img 
              src="/french_lang.jpg" 
              alt="French" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
            <div className="relative z-10 w-full flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/95 text-slate-800 text-sm font-black shadow-md border border-slate-100 font-nunito group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                <span className="text-lg">🇫🇷</span>
                <span>French</span>
              </span>
            </div>
          </button>

          {/* Chinese */}
          <button 
            onClick={() => handleLanguageSelect('Chinese')} 
            className="relative aspect-square group rounded-3xl overflow-hidden border-2 border-white/45 shadow-md hover:shadow-2xl hover:border-emerald-400 active:scale-95 hover:scale-105 transition-all duration-300 flex flex-col justify-end p-4"
          >
            <img 
              src="/chinese_lang.jpg" 
              alt="Chinese" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
            <div className="relative z-10 w-full flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/95 text-slate-800 text-sm font-black shadow-md border border-slate-100 font-nunito group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                <span className="text-lg">🇨🇳</span>
                <span>Chinese</span>
              </span>
            </div>
          </button>

          {/* English */}
          <button 
            onClick={() => handleLanguageSelect('English')} 
            className="relative aspect-square group rounded-3xl overflow-hidden border-2 border-white/45 shadow-md hover:shadow-2xl hover:border-emerald-400 active:scale-95 hover:scale-105 transition-all duration-300 flex flex-col justify-end p-4"
          >
            <img 
              src="/english_lang.jpg" 
              alt="English" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
            <div className="relative z-10 w-full flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/95 text-slate-800 text-sm font-black shadow-md border border-slate-100 font-nunito group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                <span className="text-lg">🇬🇧</span>
                <span>English</span>
              </span>
            </div>
          </button>

          {/* Italian */}
          <button 
            onClick={() => handleLanguageSelect('Italian')} 
            className="relative aspect-square group rounded-3xl overflow-hidden border-2 border-white/45 shadow-md hover:shadow-2xl hover:border-emerald-400 active:scale-95 hover:scale-105 transition-all duration-300 flex flex-col justify-end p-4"
          >
            <img 
              src="/italian_lang.jpg" 
              alt="Italian" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
            <div className="relative z-10 w-full flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/95 text-slate-800 text-sm font-black shadow-md border border-slate-100 font-nunito group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                <span className="text-lg">🇮🇹</span>
                <span>Italian</span>
              </span>
            </div>
          </button>

          {/* Spanish */}
          <button 
            onClick={() => handleLanguageSelect('Spanish')} 
            className="relative aspect-square group rounded-3xl overflow-hidden border-2 border-white/45 shadow-md hover:shadow-2xl hover:border-emerald-400 active:scale-95 hover:scale-105 transition-all duration-300 flex flex-col justify-end p-4"
          >
            <img 
              src="/spanish_lang.jpg" 
              alt="Spanish" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
            <div className="relative z-10 w-full flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/95 text-slate-800 text-sm font-black shadow-md border border-slate-100 font-nunito group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                <span className="text-lg">🇪🇸</span>
                <span>Spanish</span>
              </span>
            </div>
          </button>
        </div>
      </main>

      {/* Bottom Nav Bar */}
      <nav className="border-t border-white/20 bg-white/75 backdrop-blur-md py-3 px-6 shrink-0 mt-auto relative z-10 shadow-lg">
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
      </nav>
    </div>
  );
}

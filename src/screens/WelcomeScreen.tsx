import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Cloud, Sun, Leaf } from 'lucide-react';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative w-full min-h-screen bg-white m-0 p-0 overflow-x-hidden flex flex-col font-sans selection:bg-[#5C4033] selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        .font-nunito { font-family: 'Nunito', sans-serif; }
        .title-text { color: #3E2723; }
        .btn-text-outline {
          color: #FFFBF0;
          text-shadow: 
            -1px -1px 0 #5A3D2B,
             1px -1px 0 #5A3D2B,
            -1px  1px 0 #5A3D2B,
             1px  1px 0 #5A3D2B,
             0px 2px 0px #5A3D2B;
        }
        .btn-wooden {
          background-color: #C38E5A;
          border: 3px solid #8B5A2B;
          border-radius: 9999px;
          box-shadow: 
            inset 0 4px 0 0 rgba(255, 255, 255, 0.25),
            0 6px 0 0 #8B5A2B,
            0 8px 0 0 #5A3D2B;
          transition: all 0.1s ease;
        }
        .btn-wooden:active {
          transform: translateY(6px);
          box-shadow: 
            inset 0 2px 0 0 rgba(255, 255, 255, 0.2),
            0 0px 0 0 #8B5A2B,
            0 2px 0 0 #5A3D2B;
        }
        .panel-shadow {
          box-shadow: 0 -8px 24px rgba(62, 39, 35, 0.08);
        }
      `}</style>

      {/* Decorative CSS Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Sun */}
        <div className="absolute top-10 right-10 opacity-80 animate-pulse">
           <Sun size={80} color="#FFD166" fill="#FFD166" />
        </div>
        {/* Clouds */}
        <div className="absolute top-20 -left-6 opacity-60">
           <Cloud size={100} color="#FFFFFF" fill="#FFFFFF" />
        </div>
        <div className="absolute top-40 right-4 opacity-50">
           <Cloud size={70} color="#FFFFFF" fill="#FFFFFF" />
        </div>
        {/* Hills */}
        <div className="absolute bottom-[-10%] w-[150%] h-[50%] -left-[25%] bg-[#A3D9A5] rounded-[100%] opacity-60" />
        <div className="absolute bottom-[-5%] w-[120%] h-[40%] -left-[10%] bg-[#81C784] rounded-[100%]" />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        
        {/* Top Header */}
        <header className="flex flex-col items-center pt-16">
          <div className="rounded-full bg-[#FFFBF0]/80 p-4 mb-4 shadow-sm backdrop-blur-sm border-2 border-[#8B5A2B]/10">
             <Sprout size={48} color="#4CAF50" strokeWidth={2.5} />
          </div>
          <div className="px-4 text-center">
            <h1 className="font-nunito title-text text-[42px] font-black leading-[1.1] tracking-tight drop-shadow-sm">
              Language<br/>Farm
            </h1>
            <p className="mt-3 font-nunito text-[#8B5A2B] font-bold text-lg">Grow your fluency naturally!</p>
          </div>
        </header>
        
        {/* Spacer */}
        <div className="flex-grow"></div>
        
        {/* Bottom Action Panel */}
        <footer className="w-full bg-white pb-10 pt-8 px-6 relative flex flex-col items-center">
          <button 
            aria-label="Get Started" 
            className="mx-auto flex h-[62px] w-full max-w-[300px] items-center justify-center gap-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-nunito text-[22px] font-black tracking-wide shadow-lg hover:shadow-xl active:scale-[0.98] transition-all relative z-10"
            onClick={() => navigate('/LoginScreen')}
          >
            Get Started
          </button>
        </footer>
      </div>
    </main>
  );
}

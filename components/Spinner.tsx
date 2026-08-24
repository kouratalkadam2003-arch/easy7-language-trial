import React from 'react';

interface SpinnerProps {
  size?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'h-8 w-8' }) => {
  return (
    <svg 
      className={`animate-spin text-pink-500 ${size}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

export const LoadingDisplay: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-between h-full bg-[#EAF2F8] p-10 pb-20 animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center gap-10">
            {/* Robot Head Splash Style */}
            <div className="w-56 h-56 relative">
                 <div className="absolute inset-0 bg-white rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50 flex items-center justify-center overflow-hidden">
                    <div className="w-40 h-24 bg-purple-900 rounded-full relative flex items-center justify-center gap-4 shadow-inner">
                        <div className="absolute inset-0 rounded-full opacity-60 blur-[4px]" style={{ background: 'linear-gradient(90deg, #3B82F6 0%, #A855F7 100%)' }}></div>
                        <div className="w-10 h-10 bg-white rounded-full z-10 animate-pulse"></div>
                        <div className="w-10 h-10 bg-white rounded-full z-10 animate-pulse"></div>
                    </div>
                </div>
            </div>

            <div className="text-center space-y-4">
                <Spinner size="h-10 w-10 mx-auto opacity-50" />
                <h1 className="text-2xl font-black text-purple-800 tracking-tight">{text}</h1>
                <p className="text-slate-400 font-medium max-w-[200px] mx-auto">نقوم بتجهيز محتوى الدرس المخصص لك الآن...</p>
            </div>
        </div>

        {/* Decorative elements matching the bottom area */}
        <div className="w-full max-w-xs space-y-4">
            <div className="h-14 w-full bg-white/20 border border-white/50 rounded-full animate-pulse"></div>
            <div className="text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Easy Language AI</p>
            </div>
        </div>
    </div>
);

export const ErrorDisplay: React.FC<{ errorText: string; retryText: string; onRetry: () => void }> = ({ errorText, retryText, onRetry }) => (
    <div className="flex flex-col justify-center items-center h-full text-center">
        <p className="text-red-600 mb-4">{errorText}</p>
        <button onClick={onRetry} className="juicy-button from-gray-400 to-gray-500">
            {retryText}
        </button>
    </div>
);


export default Spinner;
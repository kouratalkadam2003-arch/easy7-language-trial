import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  Mail, 
  Lock
} from 'lucide-react';

export default function LoginScreen() {
  const navigate = useNavigate();

  return (
    <div 
      className="w-full min-h-screen m-0 p-0 overflow-x-hidden flex flex-col font-sans select-none justify-center items-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login_bg.jpg')" }}
    >
      {/* Main Content Area */}
      <main className="w-full max-w-md bg-white/90 backdrop-blur-md p-8 md:p-12 flex flex-col items-center justify-center rounded-3xl shadow-2xl border border-white/20">
        {/* Logo / Header */}
        <div className="bg-emerald-50 p-5 rounded-3xl mb-8 border border-emerald-100/50 shadow-inner">
           <Sprout size={56} className="text-emerald-500" strokeWidth={2.5} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight text-center font-nunito">
          Welcome back
        </h1>
        <p className="text-slate-500 text-sm mb-10 text-center font-semibold">
          Log in and start growing your language farm!
        </p>

        {/* Login Form */}
        <form className="w-full flex flex-col space-y-6">
          {/* Email Input Group */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 ml-1 mb-2 tracking-wider uppercase" htmlFor="email">Email Address</label>
            <div className="bg-slate-50 border border-slate-200 w-full h-14 relative flex items-center px-4 rounded-2xl focus-within:border-emerald-500 hover:border-slate-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
              <Mail size={20} className="text-slate-400" />
              <input 
                className="bg-transparent outline-none w-full h-full pl-3 text-base font-semibold text-slate-800 placeholder:text-slate-400" 
                id="email" 
                placeholder="farmer@example.com" 
                type="email" 
              />
            </div>
          </div>

          {/* Password Input Group */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 ml-1 mb-2 tracking-wider uppercase" htmlFor="password">Password</label>
            <div className="bg-slate-50 border border-slate-200 w-full h-14 relative flex items-center px-4 rounded-2xl focus-within:border-emerald-500 hover:border-slate-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
              <Lock size={20} className="text-slate-400" />
              <input 
                className="bg-transparent outline-none w-full h-full pl-3 text-base font-semibold text-slate-800 placeholder:text-slate-400" 
                id="password" 
                placeholder="••••••••" 
                type="password" 
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-center">
            <button 
              className="w-full h-14 text-lg font-bold text-white rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-md hover:shadow-lg active:scale-[0.98] transition-all relative flex justify-center items-center uppercase" 
              type="button"
              onClick={() => navigate('/SrsWordFarmDashboard')}
            >
              Start Farming
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

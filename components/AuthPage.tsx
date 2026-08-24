
import React, { useState } from 'react';
import { signInWithGoogle, signInAsGuest, loginWithEmail, signUpWithEmail } from '../services/firebase';
import Spinner from './Spinner';

interface AuthPageProps {
    onLoginSuccess: () => void;
    onLocalMode: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onLocalMode }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            // Redirect happens automatically
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء تسجيل الدخول بجوجل');
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            if (isLoginMode) {
                await loginWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
            }
            // Redirect happens automatically via onAuthStateChanged in App.tsx
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء المصادقة');
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInAsGuest();
            onLoginSuccess();
        } catch (err: any) {
            // Graceful fallback for "Failed to fetch" or invalid key
            console.warn("Guest login unavailable (Network/Config), switching to local mode automatically.");
            onLocalMode();
        }
    };

    return (
        <div className="h-full w-full relative overflow-y-auto overflow-x-hidden flex items-center justify-center bg-slate-900" dir="rtl">
            <div 
                className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-[#2c1810] to-[#0f172a]"
            ></div>

            <main className="relative z-10 flex flex-col items-center min-h-full justify-center px-6 py-10 w-full max-w-md">
                
                {/* Elly's Dialogue Bubble */}
                <div className="bg-[#fdf6e3] rounded-2xl p-4 mb-6 shadow-xl border-4 border-[#8d5a38] relative w-full animate-fade-in-up">
                    <div className="absolute -bottom-4 right-8 w-6 h-6 bg-[#fdf6e3] border-b-4 border-r-4 border-[#8d5a38] transform rotate-45"></div>
                    <p className="text-[#5c3d2e] font-bold text-sm leading-relaxed mb-2">
                        <span className="text-amber-600 font-black">إيلي:</span> "لحظة! قبل أن ندخل الكوخ... يجب أن أسجل بياناتك في دفتر القرية! المختار لا يقبل الغرباء المجهولين."
                    </p>
                    <p className="text-slate-600 font-bold text-sm leading-relaxed">
                        <span className="text-blue-700 font-black">ليث:</span> "دفتر؟ هل هذه قرية أم وزارة؟"
                    </p>
                </div>

                <div className="px-6 py-8 w-full max-w-[360px] flex flex-col items-center">
                    <h1 className="text-4xl font-black text-amber-500 mb-6 tracking-wide text-center drop-shadow-md">
                        {isLoginMode ? 'أهلاً بعودتك!' : 'تسجيل الدخول'}
                    </h1>

                    {error && (
                        <div className="mb-6 p-3 bg-red-100/90 text-red-600 text-sm rounded-lg border border-red-200 w-full">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="w-full flex flex-col space-y-4 mb-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-extrabold text-amber-100 mb-1" htmlFor="email">البريد الإلكتروني السحري</label>
                            <input 
                                className="w-full h-12 px-4 rounded-xl text-lg font-bold bg-[#fdf6e3] text-[#5c3d2e] border-2 border-[#8d5a38] focus:outline-none focus:border-amber-500" 
                                id="email" 
                                placeholder="name@example.com" 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                dir="ltr"
                            />
                        </div>
                        
                        <div className="flex flex-col">
                            <label className="text-sm font-extrabold text-amber-100 mb-1" htmlFor="password">كلمة المرور السرية</label>
                            <input 
                                className="w-full h-12 px-4 rounded-xl text-lg font-bold bg-[#fdf6e3] text-[#5c3d2e] border-2 border-[#8d5a38] focus:outline-none focus:border-amber-500" 
                                id="password" 
                                placeholder="********" 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                dir="ltr"
                            />
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button 
                                className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xl font-black shadow-lg shadow-amber-900/50 transition-all active:scale-95 flex justify-center items-center gap-2" 
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <Spinner size="h-6 w-6 text-white" /> : (isLoginMode ? 'دخول للقرية' : 'تسجيل كغريب جديد')}
                            </button>
                        </div>
                    </form>

                    <div className="flex flex-col items-center w-full space-y-3">
                        <button 
                            onClick={() => setIsLoginMode(!isLoginMode)}
                            className="text-amber-200 font-bold text-sm hover:text-white transition-colors underline underline-offset-4"
                            type="button"
                        >
                            {isLoginMode ? "ليس لديك سجل؟ انشئ حساباً جديداً" : "لديك سجل؟ ادخل من هنا"}
                        </button>

                        <div className="w-full flex items-center justify-center gap-2 my-2 opacity-50">
                            <div className="h-px bg-white flex-1"></div>
                            <span className="text-white text-xs font-bold">أو</span>
                            <div className="h-px bg-white flex-1"></div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3 bg-white text-gray-800 rounded-xl text-lg font-bold shadow-md hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-3 border border-gray-200"
                        >
                            <span className="text-2xl">G</span>
                            <span>التسجيل السريع بـ Google</span>
                        </button>

                        <button
                            onClick={handleGuestLogin}
                            disabled={loading}
                            className="w-full py-3 bg-slate-700 text-white rounded-xl text-lg font-bold shadow-md hover:bg-slate-600 transition-all active:scale-95 flex items-center justify-center gap-3 border border-slate-600 mt-2"
                        >
                            <span>👤</span>
                            <span>ادخل كضيف خفيف</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AuthPage;

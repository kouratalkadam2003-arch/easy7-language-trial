
import React, { useState } from 'react';
import { User } from 'firebase/auth';

interface UserProfileProps {
    user: User | null;
    coins: number;
    onSignOut: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, coins, onSignOut }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Extract user details or use defaults
    const avatarUrl = user?.photoURL;
    // Safer default logic
    const fullName = user?.displayName ? String(user.displayName) : 'ضيف';
    const email = user?.email;

    // Helper to get initials if no avatar
    const getInitials = (name: string) => {
        return (name || 'G').slice(0, 2).toUpperCase();
    };

    const firstName = fullName.includes(' ') ? fullName.split(' ')[0] : fullName;

    return (
        <div className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-full bg-white/50 hover:bg-white border-2 border-white transition-all shadow-sm group"
                title="ملفي الشخصي"
            >
                {/* Avatar Circle */}
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-200 bg-purple-100 flex items-center justify-center relative">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-purple-600 font-bold text-sm">{getInitials(fullName)}</span>
                    )}
                </div>
                
                {/* Coins Display (Visible on Desktop) */}
                <div className="hidden sm:flex flex-col items-start leading-none ml-1">
                    <span className="text-xs font-bold text-purple-700">{firstName}</span>
                    <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-1">
                        🪙 {coins}
                    </span>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border-2 border-purple-100 p-4 z-50 transform origin-top-left animate-fadeIn">
                        <div className="flex flex-col items-center mb-4 pb-4 border-b border-purple-50">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-purple-100 mb-2">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-500 font-bold text-xl">
                                        {getInitials(fullName)}
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-purple-800">{fullName}</h3>
                            {email && <p className="text-xs text-purple-500">{email}</p>}
                        </div>

                        <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-xl mb-4 border border-yellow-100">
                            <span className="text-sm font-bold text-yellow-700">رصيد العملات</span>
                            <span className="text-lg font-black text-yellow-600">🪙 {coins}</span>
                        </div>

                        <button 
                            onClick={onSignOut}
                            className="w-full py-2 px-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            تسجيل الخروج
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserProfile;

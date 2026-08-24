import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../farmStore';
import { dueCards, hardDueCount } from '../lib/cardStore';
import { CHARACTERS } from '../data/characters';

interface Notification {
  id: string;
  type: string;
  message: string;
  character: string;
  icon: string;
}

export const FarmNotifications: React.FC<{ onOpenFarm: () => void }> = ({ onOpenFarm }) => {
    const seeds = useFarmStore(state => state.seeds);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());

    useEffect(() => {
        const interval = setInterval(() => {
            const due = dueCards();
            const hardCount = hardDueCount('english');
            
            if (due.length > 0 && !dismissedMessages.has('due')) {
                const critical = due.filter(c => c.lapses > 3);
                
                if (critical.length > 0 && !dismissedMessages.has('critical')) {
                    const dirgham = CHARACTERS.dirgham;
                    setNotification({
                        id: 'critical',
                        type: 'danger',
                        message: `${dirgham.warnings[0]}\n${critical.length} بطاقات في خطر! لا تدع العاصفة تدمرها!`,
                        character: 'dirgham',
                        icon: dirgham.avatar
                    });
                } else if (!dismissedMessages.has('due')) {
                    const eli = CHARACTERS.eli;
                    const firstDue = due[0];
                    setNotification({
                        id: 'due',
                        type: 'review',
                        message: `${eli.encouragements[0]}\n"${firstDue.native}" تنتظر مراجعتها. لا تنساها!`,
                        character: 'eli',
                        icon: eli.avatar
                    });
                }
            }

            // Hard cards notification
            if (hardCount > 5 && !dismissedMessages.has('hard')) {
                const tom = CHARACTERS.tom;
                setNotification({
                    id: 'hard',
                    type: 'warning',
                    message: `${tom.warnings[0]}\n${hardCount} بطاقات صعبة تحتاج مراجعة عاجلة!`,
                    character: 'tom',
                    icon: tom.avatar
                });
            }

            // Crystal tree achievement
            const crystals = Object.values(seeds).filter(s => s.treeStage === 5);
            if (crystals.length > 0 && !dismissedMessages.has(`crystal_${crystals[0].id}`)) {
                const eli = CHARACTERS.eli;
                setNotification({
                    id: `crystal_${crystals[0].id}`,
                    type: 'achievement',
                    message: `🎉 مبروك!\n"${crystals[0].phrase}" أصبحت بلورية 💎 ومحفوظة للأبد!`,
                    character: 'eli',
                    icon: '💎'
                });
            }

        }, 10000);

        return () => clearInterval(interval);
    }, [dismissedMessages, seeds]);

    const handleDismiss = () => {
        if (notification) {
            setDismissedMessages(prev => new Set(prev).add(notification.id));
            setNotification(null);
        }
    };

    if (!notification) return null;

    const character = CHARACTERS[notification.character as keyof typeof CHARACTERS];

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] w-11/12 max-w-sm animate-slide-down">
            <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-4 border border-purple-100 flex items-start gap-4">
                <div className="text-3xl flex-shrink-0 animate-bounce">
                    {notification.icon}
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">{character?.nameAr || 'رسالة'}</p>
                    <p className="text-sm font-bold text-gray-800 whitespace-pre-wrap">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={() => { handleDismiss(); onOpenFarm(); }}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold py-2 rounded-lg shadow-sm hover:scale-105 transition-transform"
                        >
                            راجع الآن
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition-colors"
                        >
                            لاحقاً
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

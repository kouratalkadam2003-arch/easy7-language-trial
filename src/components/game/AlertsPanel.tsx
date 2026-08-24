import React from 'react';
import { useGameStore } from '../../game/store';

interface AlertsPanelProps {
  onClose: () => void;
}

export default function AlertsPanel({ onClose }: AlertsPanelProps) {
  const alerts = useGameStore((s) => s.alerts);
  const setAlertRead = useGameStore((s) => s.setAlertRead);

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          icon: '👁️🧙‍♂️',
          bg: 'bg-red-50 border-red-200',
          textColor: 'text-red-900',
          titleColor: 'text-red-800',
        };
      case 'drought':
        return {
          icon: '🌵🥀',
          bg: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-900',
          titleColor: 'text-amber-800',
        };
      case 'victory':
        return {
          icon: '🎉🏆',
          bg: 'bg-emerald-50 border-emerald-200',
          textColor: 'text-[#5C3D2E]',
          titleColor: 'text-emerald-800',
        };
      default:
        return {
          icon: '✉️🌸',
          bg: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-950',
          titleColor: 'text-blue-900',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" dir="rtl">
      <div className="w-full max-w-md bg-[#FDF6E3] border-4 border-[#C4603A] rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh] text-[#5C3D2E]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#C4603A]/30 pb-3 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>✉️</span> صندوق بريد القرية والرسائل
          </h2>
          <button 
            onClick={onClose}
            className="text-[#C4603A] hover:bg-[#C4603A]/10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Alerts list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {alerts.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-sm">
              لا توجد رسائل جديدة في بريد القرية حالياً.
            </div>
          ) : (
            alerts.map((item) => {
              const style = getAlertStyle(item.type);
              return (
                <div 
                  key={item.id}
                  onClick={() => setAlertRead(item.id)}
                  className={`p-3.5 border rounded-xl relative cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all flex gap-3 ${style.bg} ${!item.read ? 'ring-2 ring-[#C4603A]' : ''}`}
                >
                  {/* Read dot */}
                  {!item.read && (
                    <span className="absolute top-3 left-3 w-3.5 h-3.5 bg-red-600 border-2 border-[#FDF6E3] rounded-full animate-pulse" />
                  )}

                  {/* Icon */}
                  <div className="text-3xl p-1 bg-white/60 rounded-lg h-fit flex items-center justify-center">
                    {style.icon}
                  </div>

                  {/* Text content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`text-xs font-bold ${style.titleColor}`}>
                        {item.senderAr}
                      </span>
                      <span className="text-[10px] text-stone-500">{item.date}</span>
                    </div>
                    <p className={`text-xs leading-relaxed text-justify ${style.textColor}`}>
                      {item.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-[#C4603A]/20 pt-3 mt-4 text-center">
          <p className="text-[11px] text-stone-500">
            تذكر: مراجعة الكلمات تحافظ على مبانيك من الجفاف والتخريب وتمنع رسائل ضرغام المزعجة!
          </p>
        </div>
      </div>
    </div>
  );
}

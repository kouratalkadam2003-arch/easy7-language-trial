import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import { useFarmStore } from '@/store/farmStore'
import { Shield, BookOpen, Film, RefreshCw, X, Droplets } from 'lucide-react'

export function AdminTools() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  
  const { gameMode, setGameMode } = useUserStore()
  const { resources, addResources, seeds, waterSeed } = useFarmStore()

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] p-3 rounded-full bg-slate-900 border border-slate-700 text-[#1CB0F6] hover:bg-slate-800 transition-all shadow-xl active:scale-90 cursor-pointer flex items-center justify-center"
        title="أدوات المسؤول"
      >
        <Shield className="w-6 h-6 animate-pulse" />
      </button>
    )
  }

  // Water all seeds
  const handleWaterAll = () => {
    const seedKeys = Object.keys(seeds)
    seedKeys.forEach((id) => {
      waterSeed(id)
    })
    alert('تم سقي جميع النباتات بنجاح!')
  }

  // Unlock all stages
  const handleUnlockAll = () => {
    // We can simulate unlocking by clearing or completing days, or we can just notify
    alert('تم محاكاة فتح جميع المراحل!')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-850 text-white rounded-3xl p-6 shadow-2xl space-y-6 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#1CB0F6]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Title */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-[#1CB0F6]">
            <Shield className="w-5 h-5" />
            <h2 className="font-black text-lg">أدوات المطور والمسؤول</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase">وضع اللعب الحالي</h3>
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setGameMode('story')
                alert('تم التغيير إلى وضع القصة!')
              }}
              className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                gameMode === 'story'
                  ? 'bg-[#1CB0F6] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎭 وضع القصة
            </button>
            <button
              onClick={() => {
                setGameMode('normal')
                alert('تم التغيير إلى الوضع العادي!')
              }}
              className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                gameMode === 'normal'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ الوضع العادي (بدون سيناريوهات)
            </button>
          </div>
        </div>

        {/* Resource Mocks */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase">إضافة موارد المزرعة والقرية</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                addResources(500, 0, 0)
              }}
              className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <span>🪙</span>
              <span>+500 ذهب ({resources.gold})</span>
            </button>
            <button
              onClick={() => {
                addResources(0, 500, 0)
              }}
              className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:border-[#1CB0F6] rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <span>🪵</span>
              <span>+500 خشب ({resources.wood})</span>
            </button>
          </div>
        </div>

        {/* Story Scenes Bypass */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase">مشاهد القصة التفاعلية</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setIsOpen(false)
                navigate('/story?chapter=1')
              }}
              className="flex items-center justify-center gap-2 p-3 bg-[#1CB0F6]/10 hover:bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/20 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <Film className="w-4 h-4" />
              <span>مشاهد الفصل الأول</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                navigate('/story?chapter=2')
              }}
              className="flex items-center justify-center gap-2 p-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <Film className="w-4 h-4" />
              <span>مشاهد الفصل الثاني</span>
            </button>
          </div>
        </div>

        {/* SRS Utilities */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase">أدوات الـ SRS والتقدم</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWaterAll}
              className="flex items-center justify-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <Droplets className="w-4 h-4 text-[#1CB0F6]" />
              <span>سقي النباتات الـ SRS</span>
            </button>
            <button
              onClick={handleUnlockAll}
              className="flex items-center justify-center gap-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>فتح كافة المراحل</span>
            </button>
          </div>
        </div>

        {/* Lesson Stages Jump */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase">الانتقال السريع لمراحل الدرس</h3>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <button onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('JUMP_TO_STAGE', { detail: { stageId: 'read' } })); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">📖 القراءة</button>
            <button onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('JUMP_TO_STAGE', { detail: { stageId: 'listen' } })); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">🎧 الاستماع</button>
            <button onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('JUMP_TO_STAGE', { detail: { stageId: 'chop' } })); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">🪓 الاحتطاب</button>
            <button onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('JUMP_TO_STAGE', { detail: { stageId: 'context' } })); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">🔄 السياق</button>
            <button onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('JUMP_TO_STAGE', { detail: { stageId: 'fight' } })); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">⚔️ القتال</button>
            <button onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('JUMP_TO_STAGE', { detail: { stageId: 'chat' } })); }} className="p-1.5 bg-[#FF9600]/20 text-[#FF9600] border border-[#FF9600]/30 hover:bg-[#FF9600]/30 rounded-xl text-[10px] font-bold cursor-pointer text-center">💬 الممارسة AI</button>
            <button onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('JUMP_TO_STAGE', { detail: { stageId: 'radio' } })); }} className="p-1.5 bg-[#2CC0D0]/20 text-[#2CC0D0] border border-[#2CC0D0]/30 hover:bg-[#2CC0D0]/30 rounded-xl text-[10px] font-bold cursor-pointer text-center">📻 الراديو AI</button>
          </div>
        </div>

        {/* Navigation Shortcuts */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase">الانتقال السريع لجميع الصفحات</h3>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <button onClick={() => { setIsOpen(false); navigate('/'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">🏠 الترحيب</button>
            <button onClick={() => { setIsOpen(false); navigate('/onboarding'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">📝 التمهيد</button>
            <button onClick={() => { setIsOpen(false); navigate('/learn'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">🗺️ الخريطة</button>
            <button onClick={() => { setIsOpen(false); navigate('/lesson/d1'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">🪓 الدرس 1</button>
            <button onClick={() => { setIsOpen(false); navigate('/lesson/d8'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">⚔️ الدرس 8</button>
            <button onClick={() => { setIsOpen(false); navigate('/farm'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">🌱 المزرعة</button>
            <button onClick={() => { setIsOpen(false); navigate('/village'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">🛖 القرية</button>
            <button onClick={() => { setIsOpen(false); navigate('/shop'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">🏪 المتجر</button>
            <button onClick={() => { setIsOpen(false); navigate('/profile'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">👤 الحساب</button>
            <button onClick={() => { setIsOpen(false); navigate('/settings'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">⚙️ الإعدادات</button>
            <button onClick={() => { setIsOpen(false); navigate('/review'); }} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-bold cursor-pointer text-center">📚 المراجعة</button>
            <button onClick={() => { setIsOpen(false); navigate('/story'); }} className="p-1.5 bg-[#1CB0F6]/10 text-[#1CB0F6] hover:bg-[#1CB0F6]/20 rounded-xl text-[10px] font-bold cursor-pointer text-center">🎭 القصة 1</button>
          </div>
        </div>

        {/* Reset progress */}
        <button
          onClick={() => {
            if (confirm('هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات؟')) {
              localStorage.clear()
              window.location.reload()
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة تعيين كافة التقدم والموارد ⚠️</span>
        </button>

      </div>
    </div>
  )
}

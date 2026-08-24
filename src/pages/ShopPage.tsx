import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { Button3D } from '@/components/ui/Button3D'
import { useUserStore } from '@/store/userStore'
import { Diamond, Heart, Flame, Sparkles } from 'lucide-react'

const ITEMS = [
  { id: 1, name: 'تعبئة القلوب', nameEn: 'Refill Hearts', icon: '❤️', price: 350, currency: 'gems' },
  { id: 2, name: 'تجميد السلسلة', nameEn: 'Streak Freeze', icon: '🧊', price: 200, currency: 'gems' },
  { id: 3, name: 'درع 24 ساعة', nameEn: '24h Shield', icon: '🛡️', price: 500, currency: 'gems' },
  { id: 4, name: 'مضاعفة XP', nameEn: '2x XP Boost', icon: '⚡', price: 150, currency: 'gems' },
]

export default function ShopPage() {
  const { uiLang, gems } = useUserStore()
  const isAr = uiLang === 'ar'
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-black">{isAr ? '🛒 المتجر' : '🛒 Shop'}</h1>
      <div className="grid gap-4">
        {ITEMS.map(item => (
          <SurfaceCard key={item.id} className="flex items-center gap-4">
            <span className="text-4xl">{item.icon}</span>
            <div className="flex-1">
              <h3 className="font-bold">{isAr ? item.name : item.nameEn}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Diamond className="w-3 h-3 text-[#2CC0D0]" /> {item.price}
              </p>
            </div>
            <Button3D variant="primary" size="sm" disabled={gems < item.price}>
              {isAr ? 'شراء' : 'Buy'}
            </Button3D>
          </SurfaceCard>
        ))}
      </div>
    </div>
  )
}

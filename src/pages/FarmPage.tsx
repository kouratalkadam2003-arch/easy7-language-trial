import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { Button3D } from '@/components/ui/Button3D'
import { useUserStore } from '@/store/userStore'
import { useFarmStore, SeedData } from '@/store/farmStore'
import { ChevronLeft, Droplets } from 'lucide-react'

export default function FarmPage() {
  const navigate = useNavigate()
  const { uiLang } = useUserStore()
  const { seeds, waterSeed } = useFarmStore()
  const isAr = uiLang === 'ar'

  const seedArray = Object.values(seeds) as SeedData[]
  const needsWatering = seedArray.filter(s => s.nextReviewDate < Date.now())

  const handleWaterAll = () => {
    // In a real app, this would redirect to a ReviewPage (Flashcards SRS)
    // For now, just water them directly
    needsWatering.forEach(s => waterSeed(s.id))
    alert(isAr ? 'تم سقي الزرع (مؤقتاً)' : 'Seeds watered (placeholder)')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card/80 backdrop-blur-md sticky top-0 z-10 border-b-2 border-border">
        <button onClick={() => navigate('/learn')} className="p-2 hover:bg-muted rounded-xl transition-colors">
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        </button>
        <h1 className="text-xl font-black flex-1">{isAr ? 'المزرعة (SRS)' : 'The Farm (SRS)'}</h1>
      </div>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6">
        
        <SurfaceCard className="bg-gradient-to-br from-[#58CC02]/10 to-[#58CC02]/5 border-[#58CC02]/30 text-center py-8">
          <h2 className="text-2xl font-black mb-2 text-[#58CC02]">
            {needsWatering.length} {isAr ? 'نبتة عطشى!' : 'Thirsty plants!'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isAr 
              ? 'راجع الكلمات التي تعلمتها لكي تنمو وتصبح أشجاراً قوية.'
              : 'Review the words you learned so they grow into strong trees.'}
          </p>
          <Button3D
            variant="success"
            size="lg"
            className="mx-auto flex items-center gap-2"
            disabled={needsWatering.length === 0}
            onClick={handleWaterAll}
          >
            <Droplets className="w-5 h-5" />
            {isAr ? 'مراجعة الكلمات' : 'Review Words'}
          </Button3D>
        </SurfaceCard>

        <h3 className="text-xl font-black pt-4">{isAr ? 'حقل الكلمات' : 'Words Field'}</h3>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {seedArray.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground font-bold">
              {isAr ? 'الحقل فارغ. العب الدروس لتزرع بذوراً جديدة!' : 'Field is empty. Play lessons to plant new seeds!'}
            </div>
          ) : (
            seedArray.map((seed, i) => (
              <motion.div
                key={seed.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 p-3 bg-card rounded-2xl border-2 border-border"
              >
                <div className="text-4xl">
                  {seed.state === 'seed' ? '🌱' : seed.state === 'sprout' ? '🌿' : '🌳'}
                </div>
                <div className="text-xs font-bold text-center truncate w-full">
                  {seed.word}
                </div>
                {seed.nextReviewDate < Date.now() && (
                  <div className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    {isAr ? 'عطشى' : 'Thirsty'}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
        
      </div>
    </div>
  )
}

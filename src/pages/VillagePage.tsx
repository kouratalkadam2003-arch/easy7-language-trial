import { useNavigate } from 'react-router-dom'
import KingdomApp from '@/kingdom/App'

export default function VillagePage() {
  const navigate = useNavigate()

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950">
      <KingdomApp onBackToApp={() => navigate('/learn')} />
    </div>
  )
}

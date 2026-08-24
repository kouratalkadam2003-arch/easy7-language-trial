import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'

export function HtmlLangSync() {
  const { uiLang, theme } = useUserStore()

  useEffect(() => {
    const html = document.documentElement
    
    // Sync language and direction
    html.lang = uiLang
    html.dir = uiLang === 'ar' ? 'rtl' : 'ltr'
    
    // Sync theme
    if (theme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [uiLang, theme])

  return null
}

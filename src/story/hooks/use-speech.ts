import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
}

function getRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function useSpeech() {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const rec = getRecognition()
    setSupported(rec !== null)
    recognitionRef.current = rec
    return () => {
      rec?.abort()
    }
  }, [])

  const listen = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    setTranscript('')
    setError(null)
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = true

    rec.onresult = (event) => {
      let text = ''
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      setTranscript(text.trim())
    }
    rec.onend = () => setListening(false)
    rec.onerror = (event) => {
      setError(event.error)
      setListening(false)
    }

    try {
      rec.start()
      setListening(true)
    } catch {
      // already started
    }
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { supported, listening, transcript, error, listen, stop, setTranscript }
}

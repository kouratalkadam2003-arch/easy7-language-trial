import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface MainAudioState {
  text: string;
  speechText?: string | null;
  voiceName?: string;
  onWordIndexChange?: (index: number) => void;
}

export type PlayEngine = 'hq' | 'live' | 'standard';

interface GlobalAudioContextType {
  mainAudio: MainAudioState | null;
  setMainAudio: (audio: MainAudioState | null) => void;
  repeatCount: number;
  setRepeatCount: (count: number) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  togglePlayRef: React.MutableRefObject<() => void>;
  engine: PlayEngine;
  setEngine: (engine: PlayEngine) => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextType>({
  mainAudio: null,
  setMainAudio: () => {},
  repeatCount: 1,
  setRepeatCount: () => {},
  speed: 1.0,
  setSpeed: () => {},
  isPlaying: false,
  setIsPlaying: () => {},
  togglePlay: () => {},
  togglePlayRef: { current: () => {} } as any,
  engine: 'hq',
  setEngine: () => {},
});

export const useGlobalAudio = () => useContext(GlobalAudioContext);

export const GlobalAudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mainAudio, setMainAudio] = useState<MainAudioState | null>(null);
  const [repeatCount, setRepeatCount] = useState(1);
  const [speed, setSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [engine, setEngine] = useState<PlayEngine>('hq');
  const togglePlayRef = React.useRef<() => void>(() => {});

  return (
    <GlobalAudioContext.Provider value={{ 
      mainAudio, setMainAudio, 
      repeatCount, setRepeatCount, 
      speed, setSpeed, 
      isPlaying, setIsPlaying,
      togglePlay: () => togglePlayRef.current(),
      togglePlayRef,
      engine, setEngine
    }}>
      {children}
    </GlobalAudioContext.Provider>
  );
};

import React from 'react';
import { Map, Trophy, Target, User, ShoppingBag, Settings, BookOpen } from "lucide-react";
import { TopStatusBar } from './TopStatusBar'; 

export type TabKey = 'topicSelection' | 'cards' | 'play' | 'profile';

interface LayoutProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  hideNav?: boolean;
  children: React.ReactNode;
}

const items = [
  { id: 'topicSelection' as TabKey, label: 'التعلم', icon: Map },
  { id: 'cards' as TabKey, label: 'المراجعة', icon: BookOpen },
  { id: 'play' as TabKey, label: 'الألعاب', icon: Target },
  { id: 'profile' as TabKey, label: 'حسابي', icon: User },
];

export function Layout({ currentTab, onTabChange, hideNav, children }: LayoutProps) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground dir-rtl font-arabic overflow-hidden">
      {/* Side Nav for Desktop */}
      {!hideNav && (
        <aside className="hidden md:flex flex-col w-64 shrink-0 border-l-2 border-border bg-card sticky top-0 h-screen p-4 gap-2 z-40">
          <div className="flex items-center gap-2 px-2 py-4 mb-4 cursor-pointer" onClick={() => onTabChange('topicSelection')}>
            <span className="text-3xl">🦉</span>
            <span className="font-extrabold text-2xl text-primary tracking-tight">
              LingoBlue
            </span>
          </div>
          {items.map(({ id, icon: Icon, label }) => {
            const active = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 font-bold border-2 transition-all w-full text-right
                  ${active
                    ? "bg-accent border-primary/40 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
              >
                <Icon className="h-6 w-6" strokeWidth={2.5} />
                <span className="text-lg">{label}</span>
              </button>
            );
          })}
          <div className="mt-auto">
            <button
              className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-muted-foreground hover:bg-accent hover:text-foreground w-full text-right"
            >
              <Settings className="h-6 w-6" /> 
              <span className="text-lg">الإعدادات</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto overflow-x-hidden no-scrollbar relative">
        {!hideNav && <TopStatusBar />}
        <main className={`flex-1 flex flex-col relative w-full h-full ${!hideNav ? 'pb-24 md:pb-6' : ''}`}>
          {children}
        </main>
        
        {/* Bottom Nav for Mobile */}
        {!hideNav && (
          <nav
            aria-label="Primary"
            className="fixed bottom-0 inset-x-0 z-40 border-t-2 border-border bg-card/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]"
          >
            <ul className="flex items-stretch justify-around">
              {items.map(({ id, icon: Icon, label }) => {
                const active = currentTab === id;
                return (
                  <li key={id} className="flex-1">
                    <button
                      onClick={() => onTabChange(id)}
                      className={`w-full flex flex-col items-center justify-center gap-1 py-3 min-h-[64px] text-xs font-bold transition-colors
                        ${active ? "text-primary" : "text-muted-foreground"}
                      `}
                    >
                      <Icon
                        className={`h-7 w-7 transition-transform ${active && "scale-110"}`}
                        strokeWidth={2.5}
                      />
                      <span>{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

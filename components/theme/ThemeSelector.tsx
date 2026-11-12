'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from './ThemeProvider';
import { Sun, Moon, Sparkles, ChevronDown } from 'lucide-react';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: { id: Theme; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'dark',
      label: 'Deep Space (Dark)',
      desc: 'Obsidian navy with high-contrast glowing telemetry',
      icon: <Moon className="w-4 h-4 text-sky-400" />
    },
    {
      id: 'medium',
      label: 'Graphite (Medium)',
      desc: 'Slate and balanced graphite for technical monitoring',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'light',
      label: 'Solar Day (Light)',
      desc: 'Crisp ivory and clean slate for daylight observation',
      icon: <Sun className="w-4 h-4 text-amber-500" />
    }
  ];

  const currentThemeObj = themes.find(t => t.id === theme) || themes[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-surface hover:bg-surface-elevated transition-colors text-foreground"
        title="Switch appearance mode"
        aria-label="Appearance Mode"
      >
        {currentThemeObj.icon}
        <span className="hidden sm:inline">{currentThemeObj.label.split(' ')[0]}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 p-1.5 rounded-lg border border-border bg-surface-elevated shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Appearance Mode
          </div>
          <div className="space-y-1 mt-1">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors ${
                  theme === t.id
                    ? 'bg-solar-500/15 border border-solar-500/30 text-foreground font-semibold'
                    : 'hover:bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="mt-0.5">{t.icon}</div>
                <div>
                  <div className="text-xs">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


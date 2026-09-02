'use client';

import React from 'react';
import { QrCode, Moon, Sun, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onResetData: () => void;
}

export function Navbar({ activeTab, onNavigate, isDarkMode, onToggleDarkMode, onResetData }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-400 to-cyan-500 bg-clip-text text-transparent">
              LibQR Studio
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Next.js TS
            </span>
          </div>
        </div>

        {/* Quick Launch & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('scanner')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-xs sm:text-sm flex items-center gap-1.5 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Open Scanner</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onResetData}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
            title="Reset Mock Demo State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

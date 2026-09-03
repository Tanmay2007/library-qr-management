'use client';

import React from 'react';
import { LayoutDashboard, BookOpen, QrCode, ArrowLeftRight, Users, Printer, BookMarked, History } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export function Sidebar({ activeTab, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Book Inventory', icon: BookOpen },
    { id: 'scanner', label: 'QR Scanner Hub', icon: QrCode, badge: 'Phase 4' },
    { id: 'circulation', label: 'Circulation & Loans', icon: ArrowLeftRight },
    { id: 'borrowed', label: 'Borrowed Books', icon: BookMarked },
    { id: 'history', label: 'Transaction History', icon: History },
    { id: 'members', label: 'Members & ID Cards', icon: Users },
    { id: 'studio', label: 'Batch Label Studio', icon: Printer }
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 sticky top-20">
        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isActive ? 'bg-indigo-700 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

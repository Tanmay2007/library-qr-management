'use client';

import React from 'react';
import { BookOpen, Users, QrCode, AlertCircle, TrendingUp, CheckCircle, Clock, ArrowUpRight, Plus, Printer, Shield } from 'lucide-react';
import { QRCodeView } from './QRCodeView';
import { Book, Member, Loan, ActivityLog } from '../types';
import Image from 'next/image';

interface DashboardProps {
  books: Book[];
  members: Member[];
  loans: Loan[];
  logs: ActivityLog[];
  onNavigate: (tab: string) => void;
  onOpenNewBookModal: () => void;
}

export function Dashboard({ books, members, loans, logs, onNavigate, onOpenNewBookModal }: DashboardProps) {
  const totalBooks = books.length;
  const availableBooks = books.filter(b => b.status === 'Available').length;
  const borrowedBooks = books.filter(b => b.status === 'Borrowed').length;
  const totalMembers = members.length;
  const activeLoans = loans.filter(l => !l.returnedDate);
  const overdueLoans = activeLoans.filter(l => new Date(l.dueDate) < new Date());

  const categoryCounts = books.reduce<Record<string, number>>((acc, book) => {
    acc[book.category] = (acc[book.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-8 shadow-2xl border border-indigo-800/40">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" /> Central Library Systems • Next.js
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Library QR Management Studio
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Real-time asset tracking, automated QR check-in & check-out circulation, digital student ID cards, and instant batch spine label printing.
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('scanner')}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 flex items-center gap-2 text-sm transition-all hover:scale-105"
            >
              <QrCode className="w-4 h-4" /> Launch QR Scanner Hub
            </button>
            <button
              onClick={onOpenNewBookModal}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl border border-slate-700 flex items-center gap-2 text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add New Book Title
            </button>
            <button
              onClick={() => onNavigate('studio')}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl border border-slate-700 flex items-center gap-2 text-sm transition-all"
            >
              <Printer className="w-4 h-4" /> Batch Print QR Studio
            </button>
          </div>
        </div>

        {/* Decorative QR Pattern */}
        <div className="absolute right-6 -bottom-6 opacity-20 pointer-events-none hidden lg:block transform rotate-12 scale-125">
          <QRCodeView value="LIB-SYSTEM-MAIN" size={260} color="#6366f1" bgColor="#090d16" />
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Books</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{totalBooks}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Active Catalog
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Loan</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{borrowedBooks}</span>
            <span className="text-xs text-slate-500 font-medium">
              {((borrowedBooks / (totalBooks || 1)) * 100).toFixed(0)}% Utilization
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Members</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{totalMembers}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <CheckCircle className="w-3.5 h-3.5" /> Verified IDs
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Alerts</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{overdueLoans.length}</span>
            <span className="text-xs text-rose-500 font-medium">Needs Attention</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Categories Overview */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Inventory Category Breakdown
              </h3>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1"
              >
                View Catalog <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(categoryCounts).map(([category, count]) => (
                <div
                  key={category}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                >
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{category}</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{count}</span>
                    <span className="text-[10px] text-indigo-500 font-semibold uppercase">Titles</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Books Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
              Recently Cataloged Assets
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {books.slice(0, 4).map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
                >
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                      {book.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{book.author}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-semibold">
                        {book.id}
                      </span>
                      <span className={`text-[10px] font-bold ${book.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {book.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 h-full flex flex-col">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
              <span>Real-Time Audit Stream</span>
              <span className="text-xs text-slate-400 font-normal">Live Log</span>
            </h3>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[460px] pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        log.badge === 'success'
                          ? 'bg-emerald-500'
                          : log.badge === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{log.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {log.details}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

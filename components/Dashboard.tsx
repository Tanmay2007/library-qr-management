'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  QrCode,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Plus,
  Printer,
  Shield,
  Loader2,
  RefreshCw,
  Bookmark,
} from 'lucide-react';
import { QRCodeView } from './QRCodeView';

export interface DashboardRecentBook {
  id: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
  qrCode: string;
}

export interface DashboardRecentTransaction {
  id: string;
  status: 'ISSUED' | 'RETURNED';
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  bookTitle: string;
  bookAuthor: string;
  borrowerName: string;
  membershipNumber: string;
}

export interface DashboardData {
  titleCount: number;
  totalCopiesSum: number;
  availableCopiesSum: number;
  onLoanCount: number;
  borrowerCount: number;
  activeLoansCount: number;
  overdueCount: number;
  categoryBreakdown: { category: string; titleCount: number }[];
  recentTransactions: DashboardRecentTransaction[];
  recentBooks: DashboardRecentBook[];
}

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onOpenNewBookModal: () => void;
}

function formatActivityTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

export function Dashboard({ onNavigate, onOpenNewBookModal }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData({
        titleCount:         json.titleCount         ?? 0,
        totalCopiesSum:     json.totalCopiesSum     ?? 0,
        availableCopiesSum: json.availableCopiesSum ?? 0,
        onLoanCount:        json.onLoanCount        ?? 0,
        borrowerCount:      json.borrowerCount      ?? 0,
        activeLoansCount:   json.activeLoansCount   ?? 0,
        overdueCount:       json.overdueCount       ?? 0,
        categoryBreakdown:  json.categoryBreakdown  ?? [],
        recentTransactions: json.recentTransactions ?? [],
        recentBooks:        json.recentBooks        ?? [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const maxCategoryCount = data?.categoryBreakdown && data.categoryBreakdown.length > 0
    ? Math.max(...data.categoryBreakdown.map((c) => c.titleCount), 1)
    : 1;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-8 shadow-2xl border border-indigo-800/40">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" /> Central Library Systems • Live DB
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
      {error ? (
        <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="text-sm font-semibold">
              Could not load live statistics: {error}
            </span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Books */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Books</span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="w-7 h-7 animate-spin text-slate-300 dark:text-slate-700" />
              ) : (
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {data?.titleCount ?? 0}
                </span>
              )}
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> Active Catalog
              </span>
            </div>
          </div>

          {/* On Loan */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Loan</span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="w-7 h-7 animate-spin text-slate-300 dark:text-slate-700" />
              ) : (
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {data?.onLoanCount ?? 0}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">
                {data && data.totalCopiesSum > 0
                  ? `${((data.onLoanCount / data.totalCopiesSum) * 100).toFixed(0)}% Utilization`
                  : 'Utilization'}
              </span>
            </div>
          </div>

          {/* Active Members */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Members</span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="w-7 h-7 animate-spin text-slate-300 dark:text-slate-700" />
              ) : (
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {data?.borrowerCount ?? 0}
                </span>
              )}
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle className="w-3.5 h-3.5" /> Verified IDs
              </span>
            </div>
          </div>

          {/* Overdue Alerts */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Alerts</span>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              {isLoading ? (
                <Loader2 className="w-7 h-7 animate-spin text-slate-300 dark:text-slate-700" />
              ) : (
                <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                  {data?.overdueCount ?? 0}
                </span>
              )}
              <span className="text-xs text-rose-500 font-medium">Needs Attention</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Categories Overview with Lightweight Accessible Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Inventory Category Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proportional catalog distribution by book subject
                </p>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1"
              >
                View Catalog <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs">Loading categories...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>Could not load categories: {error}</span>
                <button
                  onClick={fetchDashboardData}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px]"
                >
                  Retry
                </button>
              </div>
            ) : !data?.categoryBreakdown || data.categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No book categories registered yet.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Horizontal Bars Chart */}
                <div className="space-y-3 pt-1">
                  {data.categoryBreakdown.map((item) => {
                    const pct = Math.max(Math.round((item.titleCount / maxCategoryCount) * 100), 4);
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.category}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {item.titleCount} {item.titleCount === 1 ? 'Title' : 'Titles'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cards Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {data.categoryBreakdown.map((item) => (
                    <div
                      key={item.category}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate" title={item.category}>
                        {item.category}
                      </span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                          {item.titleCount}
                        </span>
                        <span className="text-[10px] text-indigo-500 font-semibold uppercase">
                          {item.titleCount === 1 ? 'Title' : 'Titles'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Featured Books Preview (Recently Cataloged Assets) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Recently Cataloged Assets
              </h3>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs">Loading cataloged assets...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>Could not load cataloged assets: {error}</span>
                <button
                  onClick={fetchDashboardData}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px]"
                >
                  Retry
                </button>
              </div>
            ) : !data?.recentBooks || data.recentBooks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No books cataloged yet. Click Add New Book Title above to begin.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.recentBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
                  >
                    {/* Neutral icon badge replacing mock image */}
                    <div className="w-12 h-14 rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100 dark:from-indigo-950/80 dark:to-indigo-900/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
                      <Bookmark className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {book.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">by {book.author}</div>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="text-[10px] font-medium text-slate-400 truncate">
                          {book.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold shrink-0 ${
                            book.availableCopies > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {book.availableCopies} / {book.totalCopies} available
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real-Time Audit Stream */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 h-full flex flex-col">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
              <span>Real-Time Audit Stream</span>
              <span className="text-xs text-slate-400 font-normal">Live Log</span>
            </h3>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs">Loading audit stream...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>Could not load audit stream: {error}</span>
                <button
                  onClick={fetchDashboardData}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px]"
                >
                  Retry
                </button>
              </div>
            ) : !data?.recentTransactions || data.recentTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[460px] pr-1">
                {data.recentTransactions.map((tx) => {
                  const isReturn = tx.status === 'RETURNED';
                  const timestamp = formatActivityTime(isReturn && tx.returnedAt ? tx.returnedAt : tx.issuedAt);
                  const title = isReturn ? 'Book Returned' : 'Book Issued';
                  const details = isReturn
                    ? `"${tx.bookTitle}" checked back in from ${tx.borrowerName}`
                    : `"${tx.bookTitle}" issued to ${tx.borrowerName}`;

                  return (
                    <div
                      key={tx.id}
                      className="flex gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          isReturn ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

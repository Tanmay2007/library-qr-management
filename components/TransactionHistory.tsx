'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  BookOpen,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  X,
  ArrowUpDown,
  BookCheck,
} from 'lucide-react';

export interface DBBookSummary {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  availableCopies: number;
  totalCopies: number;
  qrCode: string;
}

export interface DBBorrowerSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  membershipNumber: string;
}

export interface TransactionRecord {
  id: string;
  bookId: string;
  borrowerId: string;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'ISSUED' | 'RETURNED';
  book: DBBookSummary;
  borrower: DBBorrowerSummary;
}

interface TransactionHistoryProps {
  onNavigate?: (tab: string) => void;
}

export function TransactionHistory({ onNavigate }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter option lists loaded from real endpoints
  const [booksList, setBooksList] = useState<{ id: string; title: string; isbn: string }[]>([]);
  const [borrowersList, setBorrowersList] = useState<{ id: string; fullName: string; membershipNumber: string }[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ISSUED' | 'RETURNED'>('ALL');
  const [overdueFilter, setOverdueFilter] = useState<'ALL' | 'ON_TIME' | 'OVERDUE'>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedBookId, setSelectedBookId] = useState<string>('ALL');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>('ALL');

  // Load books and borrowers for filter dropdowns once
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [booksRes, borrowersRes] = await Promise.all([
          fetch('/api/books'),
          fetch('/api/borrowers'),
        ]);
        if (booksRes.ok) {
          const bData = await booksRes.json();
          setBooksList(bData.map((b: any) => ({ id: b.id, title: b.title, isbn: b.isbn })));
        }
        if (borrowersRes.ok) {
          const mData = await borrowersRes.json();
          setBorrowersList(mData.map((m: any) => ({ id: m.id, fullName: m.fullName, membershipNumber: m.membershipNumber })));
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    }
    loadFilterOptions();
  }, []);

  // Fetch transactions using server-side query parameters
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (overdueFilter !== 'ALL') params.set('overdue', overdueFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (selectedBookId !== 'ALL') params.set('book', selectedBookId);
    if (selectedBorrowerId !== 'ALL') params.set('borrower', selectedBorrowerId);

    try {
      const url = `/api/transactions${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load transactions (HTTP ${res.status})`);
      }
      const data = await res.json();
      setTransactions(data);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError(err.message || 'Unable to connect to database.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, overdueFilter, fromDate, toDate, selectedBookId, selectedBorrowerId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calendar date overdue helper
  const isOverdue = (dueDateStr: string): boolean => {
    const now = new Date();
    const todayLocal = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    const dueDateLocal = dueDateStr.slice(0, 10);
    return dueDateLocal < todayLocal;
  };

  // Summary counts for current results
  const summary = useMemo(() => {
    const total = transactions.length;
    let issued = 0;
    let returned = 0;
    let overdue = 0;

    for (const t of transactions) {
      if (t.status === 'ISSUED') {
        issued += 1;
        if (isOverdue(t.dueDate)) {
          overdue += 1;
        }
      } else if (t.status === 'RETURNED') {
        returned += 1;
      }
    }

    return { total, issued, returned, overdue };
  }, [transactions]);

  // Check if any filter is active
  const isFilterActive =
    statusFilter !== 'ALL' ||
    overdueFilter !== 'ALL' ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    selectedBookId !== 'ALL' ||
    selectedBorrowerId !== 'ALL';

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setOverdueFilter('ALL');
    setFromDate('');
    setToDate('');
    setSelectedBookId('ALL');
    setSelectedBorrowerId('ALL');
  };

  const formatDate = (isoString: string | null): string => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <History className="w-3.5 h-3.5" /> Complete Circulation Audit Log
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Transaction History
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audit-grade record of every book issued and returned with server-side multi-parameter filtering.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh History
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Results */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Records
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {isLoading ? '...' : summary.total}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        {/* Active / Issued */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Currently Issued
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {isLoading ? '...' : summary.issued}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Returned */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Returned
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {isLoading ? '...' : summary.returned}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Overdue
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {isLoading ? '...' : summary.overdue}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Server-Side Filters
            </span>
            {isFilterActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Active
              </span>
            )}
          </div>

          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ISSUED">Active (ISSUED)</option>
              <option value="RETURNED">Completed (RETURNED)</option>
            </select>
          </div>

          {/* Overdue Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Overdue State
            </label>
            <select
              value={overdueFilter}
              onChange={(e) => setOverdueFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Loans</option>
              <option value="ON_TIME">On Time</option>
              <option value="OVERDUE">Overdue Only</option>
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Issued From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Issued To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Book Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Book
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="ALL">All Books</option>
              {booksList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          {/* Borrower Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Borrower
            </label>
            <select
              value={selectedBorrowerId}
              onChange={(e) => setSelectedBorrowerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="ALL">All Borrowers</option>
              {borrowersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.membershipNumber})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Area: Loading, Error, Empty, No-Results, or Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 space-y-3 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            Querying transaction history from database...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-8 rounded-2xl text-center text-rose-700 dark:text-rose-300 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
          <h3 className="font-bold text-base">Unable to Load Transaction History</h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
          >
            Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        isFilterActive ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3 shadow-sm">
            <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">
              No Transactions Match Filters
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No loan records match your current filter selection. Try changing or resetting the filters.
            </p>
            <div className="pt-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 space-y-3 shadow-sm">
            <BookCheck className="w-12 h-12 mx-auto text-emerald-500" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">
              No Transactions Recorded
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The library registry has not logged any book circulation transactions yet.
            </p>
            {onNavigate && (
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('circulation')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  Go to Circulation
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Book</th>
                  <th className="py-3.5 px-4">Borrower</th>
                  <th className="py-3.5 px-4">Issued Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Returned Date</th>
                  <th className="py-3.5 px-4 text-right">Circulation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {transactions.map((tx) => {
                  const isReturn = tx.status === 'RETURNED';
                  const overdue = !isReturn && isOverdue(tx.dueDate);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Book */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                          {tx.book.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>by {tx.book.author}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">{tx.book.isbn}</span>
                        </div>
                      </td>

                      {/* Borrower */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{tx.borrower.fullName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 pl-5">
                          {tx.borrower.membershipNumber}
                          {tx.borrower.email && ` • ${tx.borrower.email}`}
                        </div>
                      </td>

                      {/* Issued Date */}
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(tx.issuedAt)}</span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Clock
                            className={`w-3.5 h-3.5 shrink-0 ${
                              overdue ? 'text-rose-500' : 'text-slate-400'
                            }`}
                          />
                          <span className={overdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                            {formatDate(tx.dueDate)}
                          </span>
                        </div>
                      </td>

                      {/* Returned Date */}
                      <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {isReturn ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{formatDate(tx.returnedAt)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not returned</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 text-right">
                        {isReturn ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Returned
                          </span>
                        ) : overdue ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Issued • Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60">
                            <Clock className="w-3.5 h-3.5" />
                            Issued • On Time
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

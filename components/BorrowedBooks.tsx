'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  CreditCard,
  Calendar,
  Loader2,
  RefreshCw,
  Filter,
  X,
  BookCheck,
} from 'lucide-react';

export interface DBBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  qrCode: string;
}

export interface DBBorrower {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  membershipNumber: string;
}

export interface DBTransaction {
  id: string;
  bookId: string;
  borrowerId: string;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'ISSUED' | 'RETURNED';
  book: DBBook;
  borrower: DBBorrower;
}

interface BorrowedBooksProps {
  onNavigate?: (tab: string) => void;
}

type FilterStatus = 'all' | 'ontime' | 'overdue';

export function BorrowedBooks({ onNavigate }: BorrowedBooksProps) {
  const [loans, setLoans] = useState<DBTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Fetch active ISSUED transactions from database
  const fetchActiveLoans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/transactions/active');
      if (!res.ok) {
        throw new Error(`Failed to load borrowed books: ${res.statusText}`);
      }
      const data = await res.json();
      setLoans(data);
    } catch (err: any) {
      console.error('Error fetching borrowed books:', err);
      setError(err.message || 'Unable to connect to database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  // Helper: a loan is overdue only when its calendar due date is strictly
  // before today's local calendar date.  Comparing YYYY-MM-DD strings is
  // safe, locale-independent, and immune to timezone-related off-by-one
  // errors that arise when the UTC date differs from the local date.
  const isOverdue = (dueDateStr: string): boolean => {
    // Build today's date as a local YYYY-MM-DD string
    const now = new Date();
    const todayLocal = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    // Extract the YYYY-MM-DD portion from the ISO due-date string.
    // If the value is already "YYYY-MM-DD" this is a no-op; if it is a full
    // ISO timestamp ("YYYY-MM-DDTHH:mm:ss.sssZ") slice(0,10) gives the
    // calendar date in the timezone it was stored, which for Prisma/Neon
    // DateTime fields is always UTC midnight — matching library intent.
    const dueDateLocal = dueDateStr.slice(0, 10);

    // Strictly before today  →  overdue
    // Equal to today or later  →  on time
    return dueDateLocal < todayLocal;
  };

  // Summary statistics
  const totalBorrowedCount = loans.length;
  const overdueCount = useMemo(() => {
    return loans.filter((l) => isOverdue(l.dueDate)).length;
  }, [loans]);
  const onTimeCount = totalBorrowedCount - overdueCount;

  // Filtered and searched loans
  const filteredLoans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return loans.filter((loan) => {
      const overdue = isOverdue(loan.dueDate);

      // Status filter
      if (statusFilter === 'overdue' && !overdue) return false;
      if (statusFilter === 'ontime' && overdue) return false;

      // Case-insensitive multi-field search
      if (query) {
        const matchesTitle = loan.book?.title?.toLowerCase().includes(query);
        const matchesAuthor = loan.book?.author?.toLowerCase().includes(query);
        const matchesBorrower = loan.borrower?.fullName?.toLowerCase().includes(query);
        const matchesMembership = loan.borrower?.membershipNumber?.toLowerCase().includes(query);
        const matchesIsbn = loan.book?.isbn?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesAuthor && !matchesBorrower && !matchesMembership && !matchesIsbn) {
          return false;
        }
      }

      return true;
    });
  }, [loans, searchQuery, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Borrowed Books Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live overview of active book loans, patron assignments, and due date compliance.
          </p>
        </div>

        <button
          onClick={fetchActiveLoans}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Data
        </button>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Borrowed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Currently Borrowed
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {isLoading ? '...' : totalBorrowedCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* On Time Loans */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              On Time Active
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {isLoading ? '...' : onTimeCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue Loans */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Overdue Loans
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {isLoading ? '...' : overdueCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by book title, author, borrower name, or member ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            All Loans ({totalBorrowedCount})
          </button>
          <button
            onClick={() => setStatusFilter('ontime')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'ontime'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            On Time ({onTimeCount})
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Overdue ({overdueCount})
          </button>
        </div>
      </div>

      {/* Content Area: Loading, Error, Empty, No Search Results, or Loans List */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 space-y-3 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            Fetching active borrowed book transactions from database...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-8 rounded-2xl text-center text-rose-700 dark:text-rose-300 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
          <h3 className="font-bold text-base">Unable to Load Borrowed Books</h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchActiveLoans}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
          >
            Retry Fetch
          </button>
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 space-y-3 shadow-sm">
          <BookCheck className="w-12 h-12 mx-auto text-emerald-500" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">
            No Borrowed Books Active
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All registered books are currently in stock and available in the library.
          </p>
          {onNavigate && (
            <div className="pt-2">
              <button
                onClick={() => onNavigate('circulation')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
              >
                Issue a Book Loan
              </button>
            </div>
          )}
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3 shadow-sm">
          <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">
            No Borrowed Books Match Your Criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or switching the status filter.
          </p>
          <div className="pt-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
            >
              Clear Search & Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Book Title & Author</th>
                  <th className="py-3.5 px-4">Borrower Patron</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredLoans.map((loan) => {
                  const overdue = isOverdue(loan.dueDate);

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Book Details */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                          {loan.book.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>by {loan.book.author}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">{loan.book.isbn}</span>
                        </div>
                      </td>

                      {/* Borrower Patron */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{loan.borrower.fullName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 pl-5">
                          {loan.borrower.membershipNumber}
                          {loan.borrower.email && ` • ${loan.borrower.email}`}
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{new Date(loan.issuedAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-3.5 h-3.5 shrink-0 ${overdue ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span className={overdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-right">
                        {overdue ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            On Time
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

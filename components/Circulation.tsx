'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  User,
  Calendar,
  Sparkles,
  X,
  CreditCard,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Loan } from '../types';

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

interface CirculationProps {
  books?: any[];
  members?: any[];
  loans?: Loan[];
  onPerformCheckout?: (bookId: string, memberId: string, dueDateStr: string) => void;
  onPerformReturn?: (bookIdOrLoanId: string) => void;
  onExtendLoan?: (loanId: string) => void;
  [key: string]: any;
}

export function Circulation({
  loans = [],
  onPerformReturn,
  onExtendLoan,
}: CirculationProps) {
  const [filterTab, setFilterTab] = useState<'active' | 'overdue' | 'history'>('active');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Real Database Data State
  const [realBooks, setRealBooks] = useState<DBBook[]>([]);
  const [realBorrowers, setRealBorrowers] = useState<DBBorrower[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // Form State
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [dueDateStr, setDueDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [issuedSuccess, setIssuedSuccess] = useState<any | null>(null);

  // Tomorrow's date for date picker min constraint
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Fetch real books and borrowers
  const fetchCirculationData = async () => {
    setIsDataLoading(true);
    try {
      const [booksRes, borrowersRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/borrowers'),
      ]);

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setRealBooks(booksData);
      }
      if (borrowersRes.ok) {
        const borrowersData = await borrowersRes.json();
        setRealBorrowers(borrowersData);
      }
    } catch (e) {
      console.error('Error fetching circulation data:', e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculationData();
  }, []);

  const selectedBook = realBooks.find((b) => b.id === selectedBookId);
  const selectedBorrower = realBorrowers.find((b) => b.id === selectedBorrowerId);

  const handleOpenIssueModal = () => {
    setSubmitError(null);
    setSelectedBookId('');
    setSelectedBorrowerId('');
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setDueDateStr(d.toISOString().split('T')[0]);
    setIsCheckoutModalOpen(true);
    fetchCirculationData();
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedBorrowerId) {
      setSubmitError('Please select a registered library patron.');
      return;
    }
    if (!selectedBookId) {
      setSubmitError('Please select a book asset.');
      return;
    }

    if (!dueDateStr) {
      setSubmitError('Please choose a valid loan return due date.');
      return;
    }

    const selectedDue = new Date(dueDateStr);
    if (isNaN(selectedDue.getTime()) || selectedDue <= new Date()) {
      setSubmitError('Due date must be set to a valid future date.');
      return;
    }

    if (selectedBook && selectedBook.availableCopies <= 0) {
      setSubmitError(`"${selectedBook.title}" currently has 0 available copies in stock.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/transactions/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: selectedBookId,
          borrowerId: selectedBorrowerId,
          dueDate: dueDateStr,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue book loan.');
      }

      setIssuedSuccess(data);
      setIsCheckoutModalOpen(false);
      try {
        confetti({ particleCount: 45, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}

      // Refresh database records to reflect updated available copies
      await fetchCirculationData();
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while issuing the loan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const isReturned = !!loan.returnedDate;
    const isOverdue = !isReturned && new Date(loan.dueDate) < new Date();

    if (filterTab === 'active') return !isReturned;
    if (filterTab === 'overdue') return isOverdue;
    if (filterTab === 'history') return isReturned;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Circulation & Loan Operations
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Issue real book loans with atomic inventory updates backed by Neon PostgreSQL.
          </p>
        </div>

        <button
          onClick={handleOpenIssueModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-105 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Issue Book Loan
        </button>
      </div>

      {/* Success Notification Banner */}
      {issuedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="font-bold text-emerald-950 dark:text-emerald-100">
                Loan Issued Successfully!
              </div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                &ldquo;{issuedSuccess.book?.title}&rdquo; checked out to{' '}
                <span className="font-bold">{issuedSuccess.borrower?.fullName}</span> [
                {issuedSuccess.borrower?.membershipNumber}] • Due on{' '}
                {new Date(issuedSuccess.dueDate).toLocaleDateString()} (
                {issuedSuccess.book?.availableCopies} copies remaining)
              </div>
            </div>
          </div>
          <button
            onClick={() => setIssuedSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm w-fit">
        <button
          onClick={() => setFilterTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'active'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Active Loans ({loans.filter((l) => !l.returnedDate).length})
        </button>
        <button
          onClick={() => setFilterTab('overdue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Overdue ({loans.filter((l) => !l.returnedDate && new Date(l.dueDate) < new Date()).length})
        </button>
        <button
          onClick={() => setFilterTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Returned History ({loans.filter((l) => !!l.returnedDate).length})
        </button>
      </div>

      {/* Circulation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300">No Records Found</h4>
            <p className="text-xs text-slate-400">There are no loans matching the selected status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Loan ID</th>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4">Borrower Patron</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredLoans.map((loan) => {
                  const isReturned = !!loan.returnedDate;
                  const isOverdue = !isReturned && new Date(loan.dueDate) < new Date();

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {loan.id}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {loan.bookId}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {loan.memberId}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono">{loan.issuedDate}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {loan.dueDate}
                      </td>

                      <td className="py-3.5 px-4">
                        {isReturned ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Returned ({loan.returnedDate})
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse">
                            Overdue
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Active Loan
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {!isReturned && (
                          <>
                            {onExtendLoan && (
                              <button
                                onClick={() => onExtendLoan(loan.id)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs"
                              >
                                +7 Days
                              </button>
                            )}
                            {onPerformReturn && (
                              <button
                                onClick={() => onPerformReturn(loan.id)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                              >
                                Check In
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real Database Issue Loan Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Database Loan Checkout
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Issue Book Loan
              </h3>
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{submitError}</span>
              </div>
            )}

            {isDataLoading ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs">Loading database assets & patrons...</p>
              </div>
            ) : (
              <form onSubmit={handleIssueSubmit} className="space-y-4">
                {/* 1. Select Patron */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    1. Select Registered Patron *
                  </label>
                  {realBorrowers.length === 0 ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                      No borrowers found in database. Please register a patron in the Members tab first.
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedBorrowerId}
                      onChange={(e) => setSelectedBorrowerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Patron --</option>
                      {realBorrowers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.fullName} ({b.membershipNumber}) — {b.email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Select Book Asset */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    2. Select Book Title *
                  </label>
                  {realBooks.length === 0 ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                      No books found in inventory. Please register a book first.
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Book Asset --</option>
                      {realBooks.map((b) => {
                        const isAvailable = b.availableCopies > 0;
                        return (
                          <option
                            key={b.id}
                            value={b.id}
                            disabled={!isAvailable}
                            className={!isAvailable ? 'text-slate-400 bg-slate-100 dark:bg-slate-900' : ''}
                          >
                            {isAvailable
                              ? `📚 ${b.title} (${b.availableCopies}/${b.totalCopies} Available)`
                              : `🚫 [OUT OF STOCK] ${b.title} (0/${b.totalCopies})`}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Selected Book Live Availability Card */}
                {selectedBook && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {selectedBook.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          selectedBook.availableCopies > 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {selectedBook.availableCopies > 0
                          ? `${selectedBook.availableCopies} of ${selectedBook.totalCopies} Available`
                          : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Author: {selectedBook.author} • ISBN: {selectedBook.isbn}
                    </div>
                  </div>
                )}

                {/* 3. Due Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    3. Return Due Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      min={tomorrowStr}
                      value={dueDateStr}
                      onChange={(e) => setDueDateStr(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default is 14 days from today. You can select any valid future return date.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !selectedBookId ||
                      !selectedBorrowerId ||
                      (selectedBook?.availableCopies ?? 0) <= 0
                    }
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing Issue...
                      </>
                    ) : (
                      'Confirm Issue Loan'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


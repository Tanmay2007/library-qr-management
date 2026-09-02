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
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

interface CirculationProps {
  onNavigate?: (tab: string) => void;
  [key: string]: any;
}

export function Circulation({ onNavigate }: CirculationProps) {
  // Real Database Data State
  const [activeLoans, setActiveLoans] = useState<DBTransaction[]>([]);
  const [realBooks, setRealBooks] = useState<DBBook[]>([]);
  const [realBorrowers, setRealBorrowers] = useState<DBBorrower[]>([]);
  
  const [isLoadingLoans, setIsLoadingLoans] = useState<boolean>(true);
  const [loansError, setLoansError] = useState<string | null>(null);

  // Issue Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [dueDateStr, setDueDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Return Confirmation Modal State
  const [returningLoan, setReturningLoan] = useState<DBTransaction | null>(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  // Success Notification
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Tomorrow's date for date picker min constraint
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Fetch active loans from database
  const fetchActiveLoans = async () => {
    setIsLoadingLoans(true);
    setLoansError(null);
    try {
      const res = await fetch('/api/transactions/active');
      if (!res.ok) {
        throw new Error(`Failed to load active loans: ${res.statusText}`);
      }
      const data = await res.json();
      setActiveLoans(data);
    } catch (err: any) {
      console.error('Error fetching active loans:', err);
      setLoansError(err.message || 'Unable to connect to database.');
    } finally {
      setIsLoadingLoans(false);
    }
  };

  // Fetch books and borrowers for the issue modal
  const fetchBooksAndBorrowers = async () => {
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
      console.error('Error fetching books and borrowers:', e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const selectedBook = realBooks.find((b) => b.id === selectedBookId);

  const handleOpenIssueModal = () => {
    setIssueError(null);
    setSelectedBookId('');
    setSelectedBorrowerId('');
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setDueDateStr(d.toISOString().split('T')[0]);
    setIsCheckoutModalOpen(true);
    fetchBooksAndBorrowers();
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError(null);

    if (!selectedBorrowerId) {
      setIssueError('Please select a registered library patron.');
      return;
    }
    if (!selectedBookId) {
      setIssueError('Please select a book asset.');
      return;
    }

    if (!dueDateStr) {
      setIssueError('Please choose a valid loan return due date.');
      return;
    }

    const selectedDue = new Date(dueDateStr);
    if (isNaN(selectedDue.getTime()) || selectedDue <= new Date()) {
      setIssueError('Due date must be set to a valid future date.');
      return;
    }

    if (selectedBook && selectedBook.availableCopies <= 0) {
      setIssueError(`"${selectedBook.title}" currently has 0 available copies in stock.`);
      return;
    }

    setIsSubmittingIssue(true);

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

      setSuccessBanner(
        `Loan issued successfully! "${data.book?.title}" checked out to ${data.borrower?.fullName} [${data.borrower?.membershipNumber}] • Due ${new Date(data.dueDate).toLocaleDateString()}.`
      );
      setIsCheckoutModalOpen(false);
      try {
        confetti({ particleCount: 45, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}

      // Refresh active loans list
      await fetchActiveLoans();
    } catch (err: any) {
      setIssueError(err.message || 'An error occurred while issuing the loan.');
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!returningLoan) return;

    setReturnError(null);
    setIsSubmittingReturn(true);

    try {
      const res = await fetch('/api/transactions/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: returningLoan.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return.');
      }

      setSuccessBanner(
        `"${data.book?.title}" successfully returned by ${data.borrower?.fullName}! 1 copy restored to available inventory.`
      );
      setReturningLoan(null);
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      // Refresh active loans from database
      await fetchActiveLoans();
    } catch (err: any) {
      setReturnError(err.message || 'An error occurred while returning the book.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Circulation & Active Loans
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage real database-backed active book loans and process check-in returns with atomic inventory updates.
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
      {successBanner && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Loans Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Active Issued Loans
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
              {activeLoans.length} Active
            </span>
          </div>

          <button
            onClick={fetchActiveLoans}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Refresh List
          </button>
        </div>

        {isLoadingLoans ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              Loading active circulation loans from PostgreSQL...
            </p>
          </div>
        ) : loansError ? (
          <div className="p-8 text-center text-rose-600 dark:text-rose-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
            <h4 className="font-bold text-sm">Unable to Load Loans</h4>
            <p className="text-xs max-w-sm mx-auto">{loansError}</p>
            <button
              onClick={fetchActiveLoans}
              className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
            >
              Retry
            </button>
          </div>
        ) : activeLoans.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">
              No Active Loans in Circulation
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All books are currently in stock or checked in. Click &ldquo;Issue Book Loan&rdquo; above to create a new loan record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Book Details</th>
                  <th className="py-3.5 px-4">Borrower Patron</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {activeLoans.map((loan) => {
                  const isOverdue = new Date(loan.dueDate) < new Date();

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Book Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {loan.book.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          by {loan.book.author} • <span className="font-mono">{loan.book.isbn}</span>
                        </div>
                      </td>

                      {/* Borrower Patron */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {loan.borrower.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {loan.borrower.membershipNumber} • {loan.borrower.email}
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {new Date(loan.issuedAt).toLocaleDateString()}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Active Loan
                          </span>
                        )}
                      </td>

                      {/* Return Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setReturnError(null);
                            setReturningLoan(loan);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Return Book
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Confirmation Dialog Modal */}
      {returningLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setReturningLoan(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                <RotateCcw className="w-3.5 h-3.5" /> Process Book Return
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Confirm Check-In Return
              </h3>
            </div>

            {returnError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{returnError}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Book Asset
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {returningLoan.book.title}
                </div>
                <div className="text-slate-500">by {returningLoan.book.author}</div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Patron Borrower
                </span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {returningLoan.borrower.fullName} ({returningLoan.borrower.membershipNumber})
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex justify-between text-slate-500">
                <span>Due Date: {new Date(returningLoan.dueDate).toLocaleDateString()}</span>
                <span>Issued: {new Date(returningLoan.issuedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confirming this return will mark the loan record as <span className="font-bold text-emerald-600">RETURNED</span> and restore +1 available copy to inventory.
            </p>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReturn}
                onClick={handleConfirmReturn}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                {isSubmittingReturn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Checking In...
                  </>
                ) : (
                  'Confirm Return'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Book Loan Modal */}
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
            {issueError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{issueError}</span>
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
                      isSubmittingIssue ||
                      !selectedBookId ||
                      !selectedBorrowerId ||
                      (selectedBook?.availableCopies ?? 0) <= 0
                    }
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    {isSubmittingIssue ? (
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



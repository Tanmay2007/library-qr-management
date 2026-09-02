'use client';

import React, { useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Book, Member, Loan } from '../types';

interface CirculationProps {
  books: Book[];
  members: Member[];
  loans: Loan[];
  onPerformCheckout: (bookId: string, memberId: string, dueDateStr: string) => void;
  onPerformReturn: (bookIdOrLoanId: string) => void;
  onExtendLoan: (loanId: string) => void;
}

export function Circulation({ books, members, loans, onPerformCheckout, onPerformReturn, onExtendLoan }: CirculationProps) {
  const [filterTab, setFilterTab] = useState<'active' | 'overdue' | 'history'>('active');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [dueDateDays, setDueDateDays] = useState(14);

  const availableBooks = books.filter(b => b.status === 'Available');

  const filteredLoans = loans.filter(loan => {
    const isReturned = !!loan.returnedDate;
    const isOverdue = !isReturned && new Date(loan.dueDate) < new Date();

    if (filterTab === 'active') return !isReturned;
    if (filterTab === 'overdue') return isOverdue;
    if (filterTab === 'history') return isReturned;
    return true;
  });

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedBookId) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(dueDateDays));

    onPerformCheckout(selectedBookId, selectedMemberId, dueDate.toISOString().split('T')[0]);
    setIsCheckoutModalOpen(false);
    setSelectedMemberId('');
    setSelectedBookId('');

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Circulation & Loan Operations
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Perform check-out loans, process asset returns, and manage due date extensions.
          </p>
        </div>

        <button
          onClick={() => setIsCheckoutModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-105 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Issue New Book Loan
        </button>
      </div>

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
          Active Loans ({loans.filter(l => !l.returnedDate).length})
        </button>
        <button
          onClick={() => setFilterTab('overdue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Overdue ({loans.filter(l => !l.returnedDate && new Date(l.dueDate) < new Date()).length})
        </button>
        <button
          onClick={() => setFilterTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Returned History ({loans.filter(l => !!l.returnedDate).length})
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
                  const book = books.find(b => b.id === loan.bookId);
                  const member = members.find(m => m.id === loan.memberId);
                  const isReturned = !!loan.returnedDate;
                  const isOverdue = !isReturned && new Date(loan.dueDate) < new Date();

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {loan.id}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {book ? (
                          <div className="flex items-center gap-2.5">
                            <img src={book.coverUrl} alt="" className="w-7 h-9 object-cover rounded shadow-sm" />
                            <div>
                              <div className="font-bold text-xs">{book.title}</div>
                              <div className="text-[10px] text-slate-400 font-mono">[{book.id}]</div>
                            </div>
                          </div>
                        ) : loan.bookId}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {member ? (
                          <div className="flex items-center gap-2">
                            <img src={member.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                            <div>
                              <div className="font-semibold text-xs">{member.name}</div>
                              <div className="text-[10px] text-slate-400">{member.role}</div>
                            </div>
                          </div>
                        ) : loan.memberId}
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
                            <button
                              onClick={() => onExtendLoan(loan.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs"
                            >
                              +7 Days
                            </button>
                            <button
                              onClick={() => onPerformReturn(loan.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                            >
                              Check In
                            </button>
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

      {/* New Loan Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Issue Book Loan
            </h3>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  1. Select Member Patron *
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.id}] {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  2. Select Available Book Asset *
                </label>
                <select
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Available Book --</option>
                  {availableBooks.map(b => (
                    <option key={b.id} value={b.id}>
                      [{b.id}] {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  3. Loan Duration
                </label>
                <select
                  value={dueDateDays}
                  onChange={(e) => setDueDateDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                >
                  <option value={7}>7 Days (Standard Student)</option>
                  <option value={14}>14 Days (Standard Two Weeks)</option>
                  <option value={30}>30 Days (Faculty / Extended)</option>
                </select>
              </div>

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
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg"
                >
                  Confirm Issue Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { Inventory } from '../components/Inventory';
import { QRScanner } from '../components/QRScanner';
import { Circulation } from '../components/Circulation';
import { Members } from '../components/Members';
import { QRStudio } from '../components/QRStudio';
import { BorrowedBooks } from '../components/BorrowedBooks';
import { Book, Member, Loan, ActivityLog } from '../types';

import {
  INITIAL_BOOKS,
  INITIAL_MEMBERS,
  INITIAL_LOANS,
  INITIAL_LOGS
} from '../lib/mockData';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // In-memory state for non-book components in Phase 1 & 2
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAddMember = (newMember: Member) => {
    setMembers(prev => [newMember, ...prev]);
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'CREATE_MEMBER',
      title: 'Member Registered',
      details: `Registered ${newMember.name} [${newMember.id}]`,
      badge: 'success'
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handlePerformCheckout = (bookId: string, memberId: string, dueDateStr: string) => {
    const book = books.find(b => b.id === bookId);
    const member = members.find(m => m.id === memberId);
    if (!book || !member) return;

    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: 'Borrowed' } : b));

    const newLoan: Loan = {
      id: `LN-${Date.now().toString().slice(-4)}`,
      bookId,
      memberId,
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: dueDateStr || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      returnedDate: null,
      status: 'Active'
    };
    setLoans(prev => [newLoan, ...prev]);

    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'ISSUE',
      title: 'Book Issued',
      details: `"${book.title}" issued to ${member.name}`,
      badge: 'success'
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handlePerformReturn = (bookIdOrLoanId: string) => {
    const loanToReturn = loans.find(l => (l.id === bookIdOrLoanId || l.bookId === bookIdOrLoanId) && !l.returnedDate);
    if (!loanToReturn) return;

    const book = books.find(b => b.id === loanToReturn.bookId);
    const member = members.find(m => m.id === loanToReturn.memberId);

    setLoans(prev => prev.map(l => l.id === loanToReturn.id ? {
      ...l,
      returnedDate: new Date().toISOString().split('T')[0],
      status: 'Returned'
    } : l));

    setBooks(prev => prev.map(b => b.id === loanToReturn.bookId ? { ...b, status: 'Available' } : b));

    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'RETURN',
      title: 'Book Returned',
      details: `"${book?.title || loanToReturn.bookId}" checked back in from ${member?.name || loanToReturn.memberId}`,
      badge: 'info'
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleExtendLoan = (loanId: string) => {
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const currDue = new Date(l.dueDate);
        currDue.setDate(currDue.getDate() + 7);
        return { ...l, dueDate: currDue.toISOString().split('T')[0] };
      }
      return l;
    }));

    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'EXTEND',
      title: 'Loan Extended',
      details: `Loan ${loanId} extended by 7 days`,
      badge: 'info'
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleResetData = () => {
    setBooks(INITIAL_BOOKS);
    setMembers(INITIAL_MEMBERS);
    setLoans(INITIAL_LOANS);
    setLogs(INITIAL_LOGS);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onResetData={handleResetData}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-6">
        <Sidebar activeTab={activeTab} onNavigate={setActiveTab} />

        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={setActiveTab}
              onOpenNewBookModal={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'inventory' && (
            <Inventory
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'scanner' && (
            <QRScanner
              books={books}
              members={members}
              loans={loans}
              onIssueBook={(book) => setActiveTab('circulation')}
              onReturnBook={(book) => handlePerformReturn(book.id)}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'circulation' && (
            <Circulation
              books={books}
              members={members}
              loans={loans}
              onPerformCheckout={handlePerformCheckout}
              onPerformReturn={handlePerformReturn}
              onExtendLoan={handleExtendLoan}
            />
          )}

          {activeTab === 'borrowed' && (
            <BorrowedBooks onNavigate={setActiveTab} />
          )}

          {activeTab === 'members' && (
            <Members
              members={members}
              loans={loans}
              books={books}
              onAddMember={handleAddMember}
            />
          )}

          {activeTab === 'studio' && (
            <QRStudio
              books={books}
              members={members}
            />
          )}
        </main>
      </div>
    </div>
  );
}

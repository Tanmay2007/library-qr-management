'use client';

import React, { useState } from 'react';
import { Camera, Zap, BookOpen, User, Sparkles, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Book, Member, Loan } from '../types';

interface QRScannerProps {
  books: Book[];
  members: Member[];
  loans: Loan[];
  onIssueBook: (book: Book) => void;
  onReturnBook: (book: Book) => void;
  onNavigate: (tab: string) => void;
}

export function QRScanner({ books, members, loans, onIssueBook, onReturnBook, onNavigate }: QRScannerProps) {
  const [selectedPayload, setSelectedPayload] = useState<string>('');

  let resultBook: Book | undefined;
  let resultMember: Member | undefined;
  let activeLoan: Loan | undefined;
  let borrower: Member | undefined;

  if (selectedPayload.startsWith('LIB-BOOK-')) {
    resultBook = books.find(b => b.qrPayload === selectedPayload || b.id === selectedPayload.replace('LIB-BOOK-', 'BK-'));
    if (resultBook) {
      activeLoan = loans.find(l => l.bookId === resultBook?.id && !l.returnedDate);
      if (activeLoan) {
        borrower = members.find(m => m.id === activeLoan?.memberId);
      }
    }
  } else if (selectedPayload.startsWith('LIB-MEM-')) {
    resultMember = members.find(m => m.qrPayload === selectedPayload || m.id === selectedPayload.replace('LIB-MEM-', 'MEM-'));
  }

  const handleSimulateScan = (payload: string) => {
    setSelectedPayload(payload);
    try {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Top Phase 4 Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" /> Phase 4 Feature Mock Preview
          </div>
          <h2 className="text-2xl font-black">Live Hardware Camera Scanner</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Real-time web camera stream integration & WebRTC barcode decoding is scheduled for <span className="font-bold text-amber-300">Phase 4</span>. Below is an interactive manual simulation hub for testing.
          </p>
        </div>

        <div className="px-4 py-2 bg-indigo-900/60 border border-indigo-700/60 rounded-2xl text-xs font-bold text-indigo-200 shrink-0">
          Coming Soon in Phase 4
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" /> Interactive Test Simulation
            </h3>

            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  1. Simulate Scanning a Book Spine Tag
                </label>
                <select
                  value={selectedPayload.startsWith('LIB-BOOK-') ? selectedPayload : ''}
                  onChange={(e) => handleSimulateScan(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Book Asset --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.qrPayload}>
                      📚 [{b.id}] {b.title} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  2. Simulate Scanning a Patron Library Pass
                </label>
                <select
                  value={selectedPayload.startsWith('LIB-MEM-') ? selectedPayload : ''}
                  onChange={(e) => handleSimulateScan(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Member Pass --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.qrPayload}>
                      👤 [{m.id}] {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Output */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 min-h-[380px] flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              Scan Recognition Output
            </h3>

            {!selectedPayload ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Camera className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Active Scan Payload</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Select a book or member from the simulation dropdown to test recognition handling.
                </p>
              </div>
            ) : resultBook ? (
              <div className="space-y-4 my-auto">
                <div className="flex gap-4">
                  <img
                    src={resultBook.coverUrl}
                    alt={resultBook.title}
                    className="w-20 h-28 object-cover rounded-xl shadow-sm border"
                  />
                  <div className="space-y-1">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      resultBook.status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {resultBook.status}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                      {resultBook.title}
                    </h4>
                    <p className="text-xs text-slate-500">{resultBook.author}</p>
                    <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">📍 {resultBook.shelf}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {resultBook.status === 'Available' ? (
                    <button
                      onClick={() => onNavigate('circulation')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Issue Book Loan
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (resultBook) onReturnBook(resultBook);
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Process Return Check-In
                    </button>
                  )}
                </div>
              </div>
            ) : resultMember ? (
              <div className="space-y-4 my-auto">
                <div className="flex items-center gap-4">
                  <img
                    src={resultMember.avatar}
                    alt={resultMember.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500"
                  />
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{resultMember.name}</h4>
                    <p className="text-xs text-slate-500">{resultMember.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 text-[10px] font-bold rounded">
                      {resultMember.role} • {resultMember.department}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('circulation')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  Open Circulation Hub <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

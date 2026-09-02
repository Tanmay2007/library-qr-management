'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Users,
  X,
  Mail,
  Phone,
  CreditCard,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface DBBorrower {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  membershipNumber: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
  };
}

interface MembersProps {
  onNavigate?: (tab: string) => void;
  [key: string]: any;
}

export function Members({ onNavigate }: MembersProps) {
  const [borrowers, setBorrowers] = useState<DBBorrower[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    membershipNumber: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Fetch real borrowers from PostgreSQL database
  const fetchBorrowers = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/borrowers');
      if (!res.ok) {
        throw new Error(`Failed to load borrowers: ${res.statusText}`);
      }
      const data = await res.json();
      setBorrowers(data);
    } catch (err: any) {
      console.error('Error loading borrowers:', err);
      setFetchError(err.message || 'Unable to connect to database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowers();
  }, []);

  const handleOpenAddModal = () => {
    // Suggest a clean default membership ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      membershipNumber: `MEM-${new Date().getFullYear()}-${randomSuffix}`,
    });
    setSubmitError(null);
    setIsAddModalOpen(true);
  };

  const handleAddBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.membershipNumber.trim()) {
      setSubmitError('Full Name, Email Address, and Membership Number are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setSubmitError('Please provide a valid email address (e.g. name@domain.com).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/borrowers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          membershipNumber: formData.membershipNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register borrower.');
      }

      setSubmitSuccess(`"${data.fullName}" [${data.membershipNumber}] successfully registered in the patron database!`);
      setIsAddModalOpen(false);
      try {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      } catch (e) {}

      // Refresh real borrowers from database
      await fetchBorrowers();
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while registering the borrower.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Patron & Borrower Registry
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage library patrons, membership credentials, and contact records backed by Neon PostgreSQL.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-105 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Register New Patron
        </button>
      </div>

      {/* Success Notification Banner */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
          <button
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area: Loading, Error, Empty, or Borrower Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 space-y-3 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            Fetching registered borrowers from PostgreSQL database...
          </p>
        </div>
      ) : fetchError ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-8 rounded-2xl text-center text-rose-700 dark:text-rose-300 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
          <h3 className="font-bold text-base">Unable to Load Borrowers</h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">{fetchError}</p>
          <button
            onClick={fetchBorrowers}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
          >
            Retry Database Fetch
          </button>
        </div>
      ) : borrowers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 space-y-3 shadow-sm">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">
            No Borrowers Registered Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The borrower database is currently empty. Click &ldquo;Register New Patron&rdquo; above to create your first borrower record.
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              Register First Patron
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {borrowers.map((borrower) => {
            const activeLoansCount = borrower._count?.transactions || 0;
            const initials = borrower.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={borrower.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug truncate">
                          {borrower.fullName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{borrower.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Member #
                      </div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate text-xs">
                        {borrower.membershipNumber}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Phone
                      </div>
                      <div className="font-medium text-slate-700 dark:text-slate-300 truncate text-xs">
                        {borrower.phone || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Active Borrowed Loans</span>
                    </div>
                    <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                      {activeLoansCount} Books
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>ID: {borrower.id.slice(0, 8)}...</span>
                  <span>
                    Joined: {new Date(borrower.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Borrower Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Patron Database Registration
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Register Library Patron
              </h3>
            </div>

            {/* Form Error Banner */}
            {submitError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleAddBorrower} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. david.miller@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Membership # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MEM-2026-1042"
                    value={formData.membershipNumber}
                    onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving to Database...
                    </>
                  ) : (
                    'Register Patron'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


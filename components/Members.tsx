'use client';

import React, { useState } from 'react';
import { Plus, QrCode, X, Printer, UserCheck } from 'lucide-react';
import { QRCodeView } from './QRCodeView';
import { Member, Loan, Book } from '../types';

interface MembersProps {
  members: Member[];
  loans: Loan[];
  books: Book[];
  onAddMember: (newMember: Member) => void;
}

export function Members({ members, loans, books, onAddMember }: MembersProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Student' as const,
    department: 'Computer Science'
  });

  const defaultAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  ];

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newIdNum = 200 + members.length + 1;
    const newMember: Member = {
      id: `MEM-${newIdNum}`,
      qrPayload: `LIB-MEM-${newIdNum}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      avatar: defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0]
    };

    onAddMember(newMember);
    setIsAddModalOpen(false);
    setFormData({ name: '', email: '', role: 'Student', department: 'Computer Science' });
  };

  const getMemberLoans = (memberId: string) => {
    return loans.filter(l => l.memberId === memberId && !l.returnedDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Member Directory & Digital Library Cards
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage patrons, issue digital student/faculty QR library cards, and track active loans.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-105 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Member
        </button>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          const activeLoans = getMemberLoans(member.id);

          return (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-indigo-500/20"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-500">{member.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[11px] font-bold rounded-md">
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-400 font-semibold">Department</div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5">
                      {member.department}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-slate-400 font-semibold">Active Loans</div>
                    <div className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {activeLoans.length} Book(s)
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">
                  {member.id}
                </span>

                <button
                  onClick={() => setSelectedMember(member)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" /> View Digital Card
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Digital Pass Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Digital Member ID Pass
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Official Library Card
              </h3>
            </div>

            <div className="relative rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 shadow-2xl border border-indigo-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <span className="font-extrabold text-sm tracking-wider">CAMPUS LIBRARY PASS</span>
                </div>
                <span className="font-mono text-xs text-indigo-300 font-bold">{selectedMember.id}</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <img
                  src={selectedMember.avatar}
                  alt={selectedMember.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-400 shadow-md"
                />
                <div>
                  <h4 className="font-bold text-lg leading-tight">{selectedMember.name}</h4>
                  <p className="text-xs text-slate-300">{selectedMember.email}</p>
                  <p className="text-xs text-indigo-300 font-semibold mt-1">{selectedMember.role} • {selectedMember.department}</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl flex items-center justify-between border border-white/10">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-indigo-200">Scan for Issue/Return</div>
                  <div className="font-mono text-xs font-extrabold text-white">{selectedMember.qrPayload}</div>
                </div>
                <div className="p-1 bg-white rounded-lg">
                  <QRCodeView
                    value={selectedMember.qrPayload}
                    size={80}
                    color="#1e1b4b"
                    bgColor="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedMember(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" /> Print Digital Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Register Library Patron
            </h3>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  placeholder="david.m@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Researcher">Researcher</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Computer Science"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg"
                >
                  Register Patron
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Search, Plus, QrCode, Trash2, ExternalLink, X, Printer, Sparkles } from 'lucide-react';
import { QRCodeView } from './QRCodeView';
import { Book } from '../types';

interface InventoryProps {
  books: Book[];
  onAddBook: (newBook: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onNavigate: (tab: string) => void;
}

export function Inventory({ books, onAddBook, onDeleteBook, onNavigate }: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [qrModalBook, setQrModalBook] = useState<Book | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    shelf: 'Aisle 1 - Shelf A1',
    description: '',
    publishedYear: new Date().getFullYear(),
    coverUrl: ''
  });

  const categories = ['ALL', ...Array.from(new Set(books.map(b => b.category)))];
  const defaultCovers = [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80'
  ];

  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm) ||
      book.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || book.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || book.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmitNewBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) return;

    const newIdNum = 100 + books.length + 1;
    const newBook: Book = {
      id: `BK-${newIdNum}`,
      qrPayload: `LIB-BOOK-${newIdNum}`,
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn || `978-000000${newIdNum}`,
      category: formData.category,
      shelf: formData.shelf,
      status: 'Available',
      coverUrl: formData.coverUrl || defaultCovers[Math.floor(Math.random() * defaultCovers.length)],
      publishedYear: Number(formData.publishedYear) || 2026,
      description: formData.description || 'Newly registered catalog title.',
      addedDate: new Date().toISOString().split('T')[0]
    };

    onAddBook(newBook);
    setIsAddModalOpen(false);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: 'Computer Science',
      shelf: 'Aisle 1 - Shelf A1',
      description: '',
      publishedYear: new Date().getFullYear(),
      coverUrl: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Book Inventory & QR Registry
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage library assets, inspect assigned QR payloads, and update shelf locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('studio')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-sm border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" /> Print Label Grid
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Register New Book
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Title, Author, ISBN, or Book ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.filter(c => c !== 'ALL').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Borrowed">Borrowed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  book.status === 'Available'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-amber-500 text-white shadow-md'
                }`}>
                  {book.status}
                </span>

                <button
                  onClick={() => setQrModalBook(book)}
                  className="absolute bottom-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-lg hover:bg-white hover:scale-110 transition-all"
                  title="View Book QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>

                <div className="absolute bottom-3 left-3 font-mono text-xs font-bold text-white bg-slate-900/70 px-2 py-0.5 rounded">
                  {book.id}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {book.category}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  by {book.author}
                </p>
                <div className="text-xs text-slate-400 font-mono">
                  ISBN: {book.isbn}
                </div>
                <div className="pt-2 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  📍 <span>{book.shelf}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <button
                onClick={() => setQrModalBook(book)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                Inspect QR Payload <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDeleteBook(book.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete Asset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Modal */}
      {qrModalBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setQrModalBook(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Spine Tag QR Payload
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {qrModalBook.title}
              </h3>
              <p className="text-xs text-slate-500">Asset ID: {qrModalBook.id} | Shelf: {qrModalBook.shelf}</p>
            </div>

            <div className="flex justify-center py-2">
              <QRCodeView
                value={qrModalBook.qrPayload}
                size={220}
                color="#312e81"
                bgColor="#ffffff"
                centerText="LIB"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-center font-mono text-xs text-slate-600 dark:text-slate-300">
              <div>Encoded QR Payload:</div>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                {qrModalBook.qrPayload}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setQrModalBook(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setQrModalBook(null);
                  onNavigate('studio');
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Open Print Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Book Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Register New Library Asset
            </h3>

            <form onSubmit={handleSubmitNewBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Algorithms"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Author *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thomas H. Cormen"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 978-0262033848"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="History">History</option>
                    <option value="Science">Science</option>
                    <option value="Self Improvement">Self Improvement</option>
                    <option value="Fiction">Fiction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aisle 2 - Shelf B3"
                    value={formData.shelf}
                    onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
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
                  Save & Generate QR Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

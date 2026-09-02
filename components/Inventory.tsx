'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, QrCode, ExternalLink, X, Printer, Sparkles, Loader2, AlertCircle, CheckCircle2, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { QRCodeView } from './QRCodeView';

export interface DBBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryProps {
  onNavigate: (tab: string) => void;
}

export function Inventory({ onNavigate }: InventoryProps) {
  const [books, setBooks] = useState<DBBook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [qrModalBook, setQrModalBook] = useState<DBBook | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit Modal State
  const [editModalBook, setEditModalBook] = useState<DBBook | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    totalCopies: '1',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal State
  const [deleteModalBook, setDeleteModalBook] = useState<DBBook | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    totalCopies: '1',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Default fallback covers based on index
  const defaultCovers = [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80'
  ];

  // Fetch real books from Prisma database
  const fetchBooks = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/books');
      if (!res.ok) {
        throw new Error(`Failed to load books: ${res.statusText}`);
      }
      const data = await res.json();
      setBooks(data);
    } catch (err: any) {
      console.error('Error loading books:', err);
      setFetchError(err.message || 'Unable to connect to database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const categories = ['ALL', ...Array.from(new Set(['Computer Science', 'Software Engineering', 'History', 'Science', 'Self Improvement', 'Fiction', ...books.map(b => b.category)].filter(Boolean)))];

  const filteredBooks = books.filter(book => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      book.isbn.toLowerCase().includes(term) ||
      book.qrCode.toLowerCase().includes(term);

    const matchesCategory = selectedCategory === 'ALL' || book.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'Available' && book.availableCopies > 0) ||
      (selectedStatus === 'Unavailable' && book.availableCopies === 0);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmitNewBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim() || !formData.category) {
      setSubmitError('Title, Author, ISBN, and Category are required.');
      return;
    }

    const parsedCopies = Number(formData.totalCopies);
    if (!formData.totalCopies.trim() || !Number.isInteger(parsedCopies) || parsedCopies <= 0) {
      setSubmitError('Total Copies must be a whole number greater than 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          category: formData.category,
          totalCopies: Number(formData.totalCopies),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create book');
      }

      setSubmitSuccess(`"${data.title}" successfully added to library database!`);
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        author: '',
        isbn: '',
        category: 'Computer Science',
        totalCopies: '1',
      });

      // Refresh list from database
      await fetchBooks();
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while creating the book.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (book: DBBook) => {
    setEditModalBook(book);
    setEditFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: String(book.totalCopies),
    });
    setEditError(null);
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalBook) return;
    setEditError(null);

    if (!editFormData.title.trim() || !editFormData.author.trim() || !editFormData.isbn.trim() || !editFormData.category) {
      setEditError('Title, Author, ISBN, and Category are required.');
      return;
    }

    const parsedCopies = Number(editFormData.totalCopies);
    if (!editFormData.totalCopies.trim() || !Number.isInteger(parsedCopies) || parsedCopies <= 0) {
      setEditError('Total Copies must be a whole number greater than 0.');
      return;
    }

    const issuedCopies = editModalBook.totalCopies - editModalBook.availableCopies;
    if (parsedCopies < issuedCopies) {
      setEditError(`Total copies cannot be less than the number of copies currently on loan (${issuedCopies}).`);
      return;
    }

    setIsEditing(true);

    try {
      const res = await fetch(`/api/books/${editModalBook.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editFormData.title,
          author: editFormData.author,
          isbn: editFormData.isbn,
          category: editFormData.category,
          totalCopies: parsedCopies,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update book');
      }

      setBooks((prevBooks) =>
        prevBooks.map((b) => (b.id === data.id ? data : b))
      );
      setSubmitSuccess(`"${data.title}" successfully updated!`);
      setEditModalBook(null);
    } catch (err: any) {
      setEditError(err.message || 'An error occurred while updating the book.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteModalBook) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/books/${deleteModalBook.id}`, {
        method: 'DELETE',
      });

      if (res.status === 204 || res.ok) {
        setBooks((prevBooks) => prevBooks.filter((b) => b.id !== deleteModalBook.id));
        setSubmitSuccess(`"${deleteModalBook.title}" was successfully deleted from the library registry.`);
        setDeleteModalBook(null);
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete book');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred while deleting the book.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Book Inventory & Database Registry
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage real library catalog assets backed by Neon PostgreSQL & Prisma ORM.
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
            onClick={() => {
              setSubmitError(null);
              setSubmitSuccess(null);
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Register New Book
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>{submitSuccess}</span>
          </div>
          <button onClick={() => setSubmitSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Title, Author, ISBN, or QR code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.filter(c => c !== 'ALL').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Loading, Error, Empty, or Book Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            Fetching books from PostgreSQL database...
          </p>
        </div>
      ) : fetchError ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-8 rounded-2xl text-center text-rose-700 dark:text-rose-300 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
          <h3 className="font-bold text-base">Unable to Load Inventory</h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">{fetchError}</p>
          <button
            onClick={fetchBooks}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
          >
            Retry Database Fetch
          </button>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">
            {books.length === 0 ? 'No Books in Library' : 'No Books Match Your Search'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {books.length === 0
              ? 'The database is currently empty. Click "Register New Book" above to add your first title.'
              : 'No books match your current search and filter criteria. Try adjusting your search term, category, or availability status.'}
          </p>
          {books.length > 0 && (searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <div className="pt-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book, idx) => {
            const isAvailable = book.availableCopies > 0;
            const coverUrl = defaultCovers[idx % defaultCovers.length];

            return (
              <div
                key={book.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isAvailable
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-amber-500 text-white shadow-md'
                    }`}>
                      {isAvailable ? `${book.availableCopies}/${book.totalCopies} Available` : 'All Copies On Loan'}
                    </span>

                    <button
                      onClick={() => setQrModalBook(book)}
                      className="absolute bottom-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-lg hover:bg-white hover:scale-110 transition-all"
                      title="Inspect Assigned QR Identifier"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-3 left-3 font-mono text-[11px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded truncate max-w-[150px]">
                      {book.qrCode}
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
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                  <button
                    onClick={() => setQrModalBook(book)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                  >
                    Inspect QR Code <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(book)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Edit Book Details"
                    >
                      <Pencil className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeleteModalBook(book);
                        setDeleteError(null);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs font-bold flex items-center transition-colors"
                      title="Delete Book"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Inspector Modal */}
      {qrModalBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setQrModalBook(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Internal QR Identifier
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {qrModalBook.title}
              </h3>
              <p className="text-xs text-slate-500">ISBN: {qrModalBook.isbn} | Category: {qrModalBook.category}</p>
            </div>

            <div className="flex justify-center py-2">
              <QRCodeView
                value={qrModalBook.qrCode}
                size={220}
                color="#312e81"
                bgColor="#ffffff"
                centerText="LIB"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-center font-mono text-xs text-slate-600 dark:text-slate-300">
              <div>Assigned QR Code Payload:</div>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                {qrModalBook.qrCode}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setQrModalBook(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
              >
                Close Inspector
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
              Register New Book Asset
            </h3>

            {/* Form Error Banner */}
            {submitError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{submitError}</span>
              </div>
            )}

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
                    ISBN *
                  </label>
                  <input
                    type="text"
                    required
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
                    Category *
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
                    Total Copies *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.totalCopies}
                    onChange={(e) => {
                      // Allow only digits and empty string so the user can clear and retype freely
                      const raw = e.target.value;
                      if (raw === '' || /^\d+$/.test(raw)) {
                        setFormData({ ...formData, totalCopies: raw });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
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
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving to Database...
                    </>
                  ) : (
                    'Save to Database'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {editModalBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setEditModalBook(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Edit Book Details
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                QR: {editModalBook.qrCode} • ID: {editModalBook.id.slice(0, 8)}...
              </p>
            </div>

            {/* Form Error Banner */}
            {editError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Algorithms"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
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
                    value={editFormData.author}
                    onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    ISBN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 978-0262033848"
                    value={editFormData.isbn}
                    onChange={(e) => setEditFormData({ ...editFormData, isbn: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
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
                    Total Copies *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editFormData.totalCopies}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '' || /^\d+$/.test(raw)) {
                        setEditFormData({ ...editFormData, totalCopies: raw });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">
                    {editModalBook.totalCopies - editModalBook.availableCopies > 0
                      ? `Issued copies: ${editModalBook.totalCopies - editModalBook.availableCopies} (min total required)`
                      : 'All copies currently available'}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalBook(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => !isDeleting && setDeleteModalBook(null)}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Delete Book Record
                </h3>
                <p className="text-xs text-slate-500">Permanent registry removal</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                &ldquo;{deleteModalBook.title}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div>Author: {deleteModalBook.author}</div>
              <div>ISBN: {deleteModalBook.isbn}</div>
              <div>QR Code: {deleteModalBook.qrCode}</div>
            </div>

            {/* Delete Error Banner */}
            {deleteError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalBook(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBook}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Delete Book
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Printer, Palette, CheckSquare, Square, Layers } from 'lucide-react';
import { QRCodeView } from './QRCodeView';
import { Book, Member } from '../types';

interface QRStudioProps {
  books: Book[];
  members: Member[];
}

export function QRStudio({ books, members }: QRStudioProps) {
  const [qrColor, setQrColor] = useState('#1e1b4b');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [centerText, setCenterText] = useState('LIB');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>(books.map(b => b.id));

  const toggleSelectAll = () => {
    if (selectedBookIds.length === books.length) {
      setSelectedBookIds([]);
    } else {
      setSelectedBookIds(books.map(b => b.id));
    }
  };

  const toggleBookSelect = (id: string) => {
    if (selectedBookIds.includes(id)) {
      setSelectedBookIds(selectedBookIds.filter(item => item !== id));
    } else {
      setSelectedBookIds([...selectedBookIds, id]);
    }
  };

  const selectedBooks = books.filter(b => selectedBookIds.includes(b.id));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            QR Studio & Batch Label Exporter
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Customize QR tag designs and generate printable sticker label grids for book spines.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          disabled={selectedBooks.length === 0}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xl flex items-center gap-2 text-sm transition-all hover:scale-105"
        >
          <Printer className="w-5 h-5" /> Print Selected QR Sheet ({selectedBooks.length})
        </button>
      </div>

      {/* Customizer Panel & Book Selector */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Style Controls */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" /> QR Tag Styler
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                QR Foreground Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Background Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Center Badge Text
              </label>
              <input
                type="text"
                maxLength={4}
                value={centerText}
                onChange={(e) => setCenterText(e.target.value.toUpperCase())}
                placeholder="e.g. LIB"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase"
              />
            </div>
          </div>
        </div>

        {/* Book Selector List */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Select Books for Printing
            </h3>
            <button
              onClick={toggleSelectAll}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {selectedBookIds.length === books.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {books.map((book) => {
              const isSelected = selectedBookIds.includes(book.id);
              return (
                <div
                  key={book.id}
                  onClick={() => toggleBookSelect(book.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-800'
                      : 'bg-slate-50/50 border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{book.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">[{book.id}] • {book.shelf}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="print:hidden text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
          Spine Tag Printable Grid Preview ({selectedBooks.length} Labels)
        </h3>

        {selectedBooks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Select books above to generate printable QR labels.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3 print:gap-6">
            {selectedBooks.map((book) => (
              <div
                key={book.id}
                className="p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white dark:bg-slate-950 print:border-solid print:border-slate-900"
              >
                <div className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">
                  CENTRAL LIBRARY
                </div>

                <QRCodeView
                  value={book.qrPayload}
                  size={120}
                  color={qrColor}
                  bgColor={bgColor}
                  centerText={centerText}
                />

                <div className="mt-2 space-y-0.5 max-w-full">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate px-1">
                    {book.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">{book.author}</div>
                  <div className="font-mono text-[10px] font-extrabold text-indigo-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">
                    📍 {book.shelf}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

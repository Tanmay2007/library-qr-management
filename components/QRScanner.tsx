'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Search,
  BookOpen,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Zap,
  RotateCcw,
  X,
  User,
  Calendar,
  CreditCard,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { QRCodeView } from './QRCodeView';

export interface ScannedBook {
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

export interface ScannedLoan {
  id: string;
  bookId: string;
  borrowerId: string;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'ISSUED' | 'RETURNED';
  book: ScannedBook;
  borrower: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    membershipNumber: string;
  };
}

interface QRScannerProps {
  onNavigate?: (tab: string) => void;
  books?: any[];
  members?: any[];
  loans?: any[];
  onIssueBook?: (book: any) => void;
  onReturnBook?: (book: any) => void;
}

type ScannerStatus =
  | 'idle'
  | 'requesting'
  | 'scanning'
  | 'looking_up'
  | 'found'
  | 'not_found'
  | 'permission_denied'
  | 'error';

export function QRScanner({ onNavigate }: QRScannerProps) {
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedPayload, setScannedPayload] = useState<string>('');
  const [foundBook, setFoundBook] = useState<ScannedBook | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isManualLoading, setIsManualLoading] = useState<boolean>(false);

  // Return Flow States
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isLoadingActiveLoans, setIsLoadingActiveLoans] = useState(false);
  const [activeLoansForBook, setActiveLoansForBook] = useState<ScannedLoan[]>([]);
  const [selectedLoanIdToReturn, setSelectedLoanIdToReturn] = useState<string | null>(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccessMessage, setReturnSuccessMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  // Stop all camera streams and controls cleanly
  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {
        console.error('Error stopping ZXing controls:', e);
      }
      controlsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      } catch (e) {
        console.error('Error stopping video tracks:', e);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Lookup book by QR Code payload from PostgreSQL via Next.js API
  const lookupBookByQR = async (qrCodePayload: string) => {
    const trimmed = qrCodePayload.trim();
    if (!trimmed) return;

    setScannedPayload(trimmed);
    setScannerStatus('looking_up');
    setErrorMessage(null);
    setReturnSuccessMessage(null);

    try {
      const res = await fetch(
        `/api/books/lookup?qrCode=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();

      if (res.ok) {
        setFoundBook(data);
        setScannerStatus('found');
        try {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
      } else {
        setFoundBook(null);
        setErrorMessage(data.error || 'QR code not recognized in library registry.');
        setScannerStatus('not_found');
      }
    } catch (err: any) {
      console.error('Lookup error:', err);
      setFoundBook(null);
      setErrorMessage(err.message || 'Unable to connect to database lookup service.');
      setScannerStatus('error');
    }
  };

  // Start live hardware camera stream with ZXing
  const startScanner = async () => {
    stopScanner();
    setScannerStatus('requesting');
    setErrorMessage(null);
    setFoundBook(null);
    setReturnSuccessMessage(null);

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader();
      }

      // Check for mediaDevices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment.');
      }

      setScannerStatus('scanning');

      if (!videoRef.current) {
        throw new Error('Video element not initialized.');
      }

      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        undefined, // Default / back camera
        videoRef.current,
        (result, error, controls) => {
          if (result) {
            const rawText = result.getText();
            if (rawText) {
              // Immediately stop camera upon successful decode
              controls.stop();
              controlsRef.current = null;
              stopScanner();
              lookupBookByQR(rawText);
            }
          }
        }
      );

      controlsRef.current = controls;
    } catch (err: any) {
      console.error('Camera startup error:', err);
      stopScanner();
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.toLowerCase().includes('permission')
      ) {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser settings.');
        setScannerStatus('permission_denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found on this computer or system.');
        setScannerStatus('permission_denied');
      } else {
        setErrorMessage(err.message || 'Failed to initialize video camera scanner.');
        setScannerStatus('error');
      }
    }
  };

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    stopScanner();
    setIsManualLoading(true);
    await lookupBookByQR(manualInput.trim());
    setIsManualLoading(false);
  };

  const handleResetScanner = () => {
    stopScanner();
    setScannerStatus('idle');
    setErrorMessage(null);
    setFoundBook(null);
    setScannedPayload('');
    setReturnSuccessMessage(null);
  };

  // Open return modal and fetch active loans for the scanned book
  const handleOpenReturnModal = async () => {
    if (!foundBook) return;

    setReturnError(null);
    setSelectedLoanIdToReturn(null);
    setIsLoadingActiveLoans(true);
    setIsReturnModalOpen(true);

    try {
      const res = await fetch(
        `/api/transactions/active?qrCode=${encodeURIComponent(foundBook.qrCode)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load active loans for this book.');
      }

      setActiveLoansForBook(data);
      // If exactly 1 active loan exists, pre-select it automatically
      if (data.length === 1) {
        setSelectedLoanIdToReturn(data[0].id);
      }
    } catch (err: any) {
      setReturnError(err.message || 'Failed to fetch active loans.');
    } finally {
      setIsLoadingActiveLoans(false);
    }
  };

  // Process the return for the chosen active loan
  const handleConfirmQRReturn = async () => {
    if (!selectedLoanIdToReturn) {
      setReturnError('Please select an active loan to return.');
      return;
    }

    setReturnError(null);
    setIsSubmittingReturn(true);

    try {
      const res = await fetch('/api/transactions/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: selectedLoanIdToReturn,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return.');
      }

      // Update state
      setReturnSuccessMessage(
        `"${data.book?.title}" returned by ${data.borrower?.fullName}! 1 copy restored to available stock.`
      );
      setIsReturnModalOpen(false);

      // Update found book availableCopies in UI
      if (foundBook) {
        setFoundBook({
          ...foundBook,
          availableCopies: Math.min(foundBook.availableCopies + 1, foundBook.totalCopies),
        });
      }

      try {
        confetti({ particleCount: 45, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err: any) {
      setReturnError(err.message || 'An error occurred while processing the return.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" /> Database-Backed Real Scanner
          </div>
          <h2 className="text-2xl font-black">Live Hardware Camera Scanner</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Scan physical QR spine tags with your device camera or test with internal database identifiers (<span className="font-mono text-indigo-300">LIB-BOOK-...</span>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {scannerStatus === 'scanning' ? (
            <button
              onClick={handleResetScanner}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <CameraOff className="w-4 h-4" /> Stop Camera
            </button>
          ) : (
            <button
              onClick={startScanner}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
            >
              <Camera className="w-4 h-4" /> Start Camera Scanner
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {returnSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{returnSuccessMessage}</span>
          </div>
          <button
            onClick={() => setReturnSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Viewfinder & Manual Test Input */}
        <div className="lg:col-span-7 space-y-6">
          {/* Viewfinder Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-500" /> Live Optical Viewfinder
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                scannerStatus === 'scanning'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                  : scannerStatus === 'requesting'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {scannerStatus === 'scanning'
                  ? 'Active Scan Feed'
                  : scannerStatus === 'requesting'
                  ? 'Requesting Access'
                  : 'Camera Idle'}
              </span>
            </div>

            {/* Video Viewport Container */}
            <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {/* HTML5 Video Element */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${
                  scannerStatus === 'scanning' ? 'block' : 'hidden'
                }`}
                playsInline
                muted
              />

              {/* Scanning Reticle & Laser (when scanning) */}
              {scannerStatus === 'scanning' && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="relative w-56 h-56 border-2 border-indigo-500/60 rounded-3xl shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center">
                    {/* Corner Accent Brackets */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />

                    {/* Animated Scanning Beam */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-bounce shadow-[0_0_8px_rgba(129,140,248,1)]" />
                  </div>
                  <p className="mt-4 text-xs font-bold text-indigo-300 bg-slate-950/80 px-3 py-1 rounded-full backdrop-blur-sm">
                    Center QR code inside target box
                  </p>
                </div>
              )}

              {/* Idle Overlay */}
              {scannerStatus === 'idle' && (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-slate-900 border border-slate-800 text-slate-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <QrCode className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-200 text-base">Camera Scanner Ready</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click the button below to enable camera stream and scan library spine QR codes.
                    </p>
                  </div>
                  <button
                    onClick={startScanner}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg inline-flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <Camera className="w-4 h-4" /> Start Scanner
                  </button>
                </div>
              )}

              {/* Requesting Access Overlay */}
              {scannerStatus === 'requesting' && (
                <div className="text-center p-8 space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
                  <p className="font-bold text-slate-200 text-sm">Requesting Camera Permissions...</p>
                  <p className="text-xs text-slate-400">Please grant permission in your browser prompt.</p>
                </div>
              )}

              {/* Looking Up Database Overlay */}
              {scannerStatus === 'looking_up' && (
                <div className="text-center p-8 space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
                  <p className="font-bold text-slate-200 text-sm">Querying PostgreSQL Database...</p>
                  <p className="text-xs text-slate-400 font-mono">Payload: {scannedPayload}</p>
                </div>
              )}

              {/* Permission Denied / Error Overlay */}
              {(scannerStatus === 'permission_denied' || scannerStatus === 'error') && (
                <div className="text-center p-6 space-y-3 max-w-md">
                  <div className="w-12 h-12 bg-rose-950/60 text-rose-400 border border-rose-800 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-rose-300 text-sm">Camera Stream Unavailable</h4>
                  <p className="text-xs text-slate-400">{errorMessage}</p>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={startScanner}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                    >
                      Retry Camera
                    </button>
                    <button
                      onClick={handleResetScanner}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Found Overlay */}
              {scannerStatus === 'found' && foundBook && (
                <div className="text-center p-8 space-y-3">
                  <div className="w-14 h-14 bg-emerald-950/80 text-emerald-400 border border-emerald-700/80 rounded-3xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-emerald-300 text-base">QR Recognized!</h4>
                  <p className="text-xs text-slate-300 font-medium line-clamp-1">{foundBook.title}</p>
                  <button
                    onClick={startScanner}
                    className="mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Scan Another Code
                  </button>
                </div>
              )}

              {/* Not Found Overlay */}
              {scannerStatus === 'not_found' && (
                <div className="text-center p-6 space-y-3 max-w-md">
                  <div className="w-12 h-12 bg-amber-950/80 text-amber-400 border border-amber-700/80 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-amber-300 text-sm">Unrecognized QR Payload</h4>
                  <p className="text-xs text-slate-400 font-mono break-all">{scannedPayload}</p>
                  <p className="text-xs text-slate-500">{errorMessage}</p>
                  <button
                    onClick={startScanner}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                  >
                    Scan Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Test Input Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" /> Manual QR Code Test Input
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test database lookups without a physical camera or QR tag by typing or pasting an assigned QR code payload.
            </p>

            <form onSubmit={handleManualLookup} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. LIB-BOOK-1725280000000-1234"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isManualLoading || !manualInput.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2 shrink-0 transition-all"
              >
                {isManualLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Looking up...
                  </>
                ) : (
                  'Lookup Book'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Database Lookup Result */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 min-h-[460px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Database Record Match
                </h3>
                {foundBook && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    HTTP 200 Matched
                  </span>
                )}
              </div>

              {!foundBook ? (
                <div className="py-16 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                    No Active Book Record
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Scan a book QR code with your camera or enter a test payload on the left to inspect its live database asset details.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in zoom-in duration-200">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {foundBook.category}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        foundBook.availableCopies > 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {foundBook.availableCopies > 0
                        ? `${foundBook.availableCopies}/${foundBook.totalCopies} Copies Available`
                        : 'All Copies On Loan'}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h4 className="font-bold text-xl text-slate-900 dark:text-slate-100 leading-snug">
                      {foundBook.title}
                    </h4>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                      by {foundBook.author}
                    </p>
                  </div>

                  {/* Metadata Specs Grid */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        ISBN
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {foundBook.isbn}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Category
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {foundBook.category}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Copies
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {foundBook.totalCopies}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Available Copies
                      </div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {foundBook.availableCopies}
                      </div>
                    </div>
                  </div>

                  {/* QR Payload Card */}
                  <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      <Sparkles className="w-3 h-3" /> Database QR Payload
                    </div>
                    <div className="font-mono text-xs font-bold text-indigo-900 dark:text-indigo-200 break-all">
                      {foundBook.qrCode}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {foundBook && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={handleOpenReturnModal}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Return this Scanned Book
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleResetScanner}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
                  >
                    Clear Match
                  </button>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('inventory')}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
                    >
                      View in Inventory
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR-Assisted Return Modal */}
      {isReturnModalOpen && foundBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsReturnModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                <RotateCcw className="w-3.5 h-3.5" /> QR-Assisted Return Check-In
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Check-In Scanned Book
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {foundBook.title} (ISBN: {foundBook.isbn})
              </p>
            </div>

            {returnError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{returnError}</span>
              </div>
            )}

            {isLoadingActiveLoans ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs">Querying active loans for this scanned book...</p>
              </div>
            ) : activeLoansForBook.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-center space-y-3 border border-slate-200 dark:border-slate-700/60">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  This book is not currently issued.
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All {foundBook.totalCopies} copies of &ldquo;{foundBook.title}&rdquo; are currently accounted for in available inventory stock.
                </p>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {activeLoansForBook.length === 1
                      ? 'Active Borrower Record'
                      : `Select Borrower Loan (${activeLoansForBook.length} Active Copies on Loan)`}
                  </label>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {activeLoansForBook.map((loan) => {
                      const isSelected = selectedLoanIdToReturn === loan.id;
                      const isOverdue = new Date(loan.dueDate) < new Date();

                      return (
                        <div
                          key={loan.id}
                          onClick={() => setSelectedLoanIdToReturn(loan.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                  {loan.borrower.fullName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {loan.borrower.membershipNumber} • {loan.borrower.email}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isOverdue ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                  Overdue
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/40 flex justify-between text-[11px] text-slate-500">
                            <span>Issued: {new Date(loan.issuedAt).toLocaleDateString()}</span>
                            <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500 border border-slate-200/60 dark:border-slate-700/40">
                  Confirming this action will record the book check-in timestamp and immediately restore +1 copy to available inventory.
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingReturn || !selectedLoanIdToReturn}
                    onClick={handleConfirmQRReturn}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    {isSubmittingReturn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing Return...
                      </>
                    ) : (
                      'Confirm Return'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


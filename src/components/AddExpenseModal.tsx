import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Square,
  Camera,
  Loader2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Receipt as ReceiptIcon,
  Wand2,
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { ExpenseCategory, Transaction } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (
    tx: Omit<Transaction, 'id'>,
    isSubscription?: boolean
  ) => void;
}

// Client-side downscaler to optimize receipt images for fast, reliable OCR upload
const optimizeImageForOCR = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [amount, setAmount] = useState<string>('0.00');
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory>('Food');
  const [merchant, setMerchant] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [isSubscription, setIsSubscription] = useState<boolean>(false);

  // AI loading, Voice & OCR states
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
  const [isScanningReceipt, setIsScanningReceipt] = useState<boolean>(false);
  const [voiceText, setVoiceText] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showVoiceTextInput, setShowVoiceTextInput] = useState<boolean>(false);
  const [manualVoicePhrase, setManualVoicePhrase] = useState<string>('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptStatus, setReceiptStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    engine?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup microphone stream on close/unmount
  useEffect(() => {
    if (!isOpen) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      setIsVoiceRecording(false);
    }
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const applyParsedExpense = (parsed: any) => {
    if (!parsed) return;
    if (parsed.amount !== undefined && Number(parsed.amount) > 0) {
      setAmount(String(parsed.amount));
    }
    if (parsed.merchant) setMerchant(String(parsed.merchant));
    if (parsed.note) setNote(String(parsed.note));
    if (parsed.category) {
      const matched = CATEGORIES.find(
        (c) => c.name.toLowerCase() === String(parsed.category).toLowerCase()
      );
      setSelectedCategory((matched?.name || 'Other') as ExpenseCategory);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocation('Bengaluru, KA');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setIsDetectingLocation(false);
        setLocation('Nearby Venue');
      },
      () => {
        setIsDetectingLocation(false);
        setLocation('Indiranagar, Bengaluru');
      },
      { timeout: 5000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction(
      {
        amount: parsedAmount,
        category: selectedCategory,
        merchant: merchant.trim() || undefined,
        location: location.trim() || undefined,
        note: note.trim() || undefined,
        date: new Date().toISOString(),
        isSubscription,
      },
      isSubscription
    );

    // Reset & close
    setAmount('0.00');
    setMerchant('');
    setNote('');
    setLocation('');
    setIsSubscription(false);
    setReceiptPreview(null);
    setReceiptStatus(null);
    setVoiceText('');
    setVoiceError(null);
    setManualVoicePhrase('');
    setShowVoiceTextInput(false);
    onClose();
  };

  // Process receipt via Gemini Vision OCR API
  const processReceiptImage = async (
    base64: string,
    fallbackMimeType: string,
    fileName?: string
  ) => {
    setIsScanningReceipt(true);
    setReceiptStatus(null);
    try {
      const dataUrlMatch = base64.match(/^data:([^;]+);base64,/i);
      const actualMimeType = dataUrlMatch?.[1] || fallbackMimeType || 'image/jpeg';

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: actualMimeType,
          fileName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        applyParsedExpense(data.data);
        setReceiptStatus({
          type: 'success',
          message: `Extracted ₹${data.data.amount || '0'} from ${
            data.data.merchant || 'Receipt'
          } (${data.data.category || 'Other'})`,
          engine: data.engine,
        });
      } else {
        setReceiptStatus({
          type: 'error',
          message: data.error || 'Could not parse receipt automatically.',
        });
      }
    } catch (err: any) {
      console.error(err);
      setReceiptStatus({
        type: 'error',
        message: 'Receipt scan failed. Please check your network connection.',
      });
    } finally {
      setIsScanningReceipt(false);
    }
  };

  // Receipt Scanner file handler
  const handleReceiptFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanningReceipt(true);
      const optimizedBase64 = await optimizeImageForOCR(file);
      setReceiptPreview(optimizedBase64);
      const mimeMatch = optimizedBase64.match(/^data:([^;]+);base64,/i);
      await processReceiptImage(
        optimizedBase64,
        mimeMatch?.[1] || 'image/jpeg',
        file.name
      );
    } catch (err) {
      console.error(err);
      setIsScanningReceipt(false);
      setReceiptStatus({
        type: 'error',
        message: 'Could not process receipt image.',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Quick sample receipt generator for instant demo & testing
  const handleSampleReceipt = async (
    sampleType: 'starbucks' | 'supermarket' | 'uber'
  ) => {
    setIsScanningReceipt(true);
    setReceiptStatus(null);

    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 580;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fcfcfc';
      ctx.fillRect(0, 0, 440, 580);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(10, 10, 420, 560);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';

      if (sampleType === 'starbucks') {
        ctx.fillText('★ STARBUCKS COFFEE ★', 220, 55);
        ctx.font = '13px monospace';
        ctx.fillText('Store #1042 - 100ft Rd, Indiranagar', 220, 85);
        ctx.fillText('Tax Invoice / Receipt', 220, 105);
        ctx.fillText('--------------------------------------', 220, 130);
        ctx.textAlign = 'left';
        ctx.fillText('1x Caramel Macchiato Venti     ₹340.00', 30, 170);
        ctx.fillText('1x Blueberry Cheese Muffin     ₹180.00', 30, 205);
        ctx.fillText('Subtotal:                      ₹520.00', 30, 255);
        ctx.fillText('CGST (2.5%):                    ₹13.00', 30, 285);
        ctx.fillText('SGST (2.5%):                    ₹13.00', 30, 315);
        ctx.fillText('--------------------------------------', 30, 345);
        ctx.font = 'bold 18px monospace';
        ctx.fillText('TOTAL PAYABLE:                ₹546.00', 30, 385);
        ctx.font = '13px monospace';
        ctx.fillText('Payment: UPI Accepted', 30, 425);
        ctx.fillText('Thank you for visiting Starbucks!', 30, 480);
      } else if (sampleType === 'supermarket') {
        ctx.fillText('🛒 DMART SUPERMARKET', 220, 55);
        ctx.font = '13px monospace';
        ctx.fillText('Avenue Supermarts Ltd - Koramangala', 220, 85);
        ctx.fillText('Retail Cash Bill', 220, 105);
        ctx.fillText('--------------------------------------', 220, 130);
        ctx.textAlign = 'left';
        ctx.fillText('1x Organic A2 Milk 1L           ₹78.00', 30, 170);
        ctx.fillText('2x Quaker Rolled Oats 1kg      ₹360.00', 30, 205);
        ctx.fillText('1x California Almonds 500g     ₹450.00', 30, 240);
        ctx.fillText('1x Extra Virgin Olive Oil 1L   ₹740.00', 30, 275);
        ctx.fillText('Subtotal:                     ₹1628.00', 30, 315);
        ctx.fillText('Store Discount (Special):     -₹150.00', 30, 345);
        ctx.fillText('--------------------------------------', 30, 375);
        ctx.font = 'bold 18px monospace';
        ctx.fillText('NET PAYABLE:                 ₹1478.00', 30, 415);
        ctx.font = '13px monospace';
        ctx.fillText('Mode: Contactless Card', 30, 455);
      } else {
        ctx.fillText('🚕 UBER TRIP INVOICE', 220, 55);
        ctx.font = '13px monospace';
        ctx.fillText('Uber India Systems Pvt Ltd', 220, 85);
        ctx.fillText('Receipt ID: CR-89420-UB', 220, 105);
        ctx.fillText('--------------------------------------', 220, 130);
        ctx.textAlign = 'left';
        ctx.fillText('Trip Fare (Uber Premier)       ₹240.00', 30, 170);
        ctx.fillText('Distance Fare (12.4 km)        ₹110.00', 30, 205);
        ctx.fillText('Toll & Airport Surcharge        ₹45.00', 30, 240);
        ctx.fillText('--------------------------------------', 30, 280);
        ctx.font = 'bold 18px monospace';
        ctx.fillText('TOTAL CHARGED:                 ₹395.00', 30, 320);
        ctx.font = '13px monospace';
        ctx.fillText('Driver Partner: Suresh K.', 30, 360);
        ctx.fillText('Auto-debited from UPI Wallet', 30, 395);
      }
    }

    const sampleBase64 = canvas.toDataURL('image/jpeg', 0.85);
    setReceiptPreview(sampleBase64);
    await processReceiptImage(
      sampleBase64,
      'image/jpeg',
      `${sampleType}_invoice.jpg`
    );
  };

  // Parse a typed natural-language phrase via /api/voice-parse
  const handleParseTextPhrase = async (phraseToParse?: string) => {
    const text = (phraseToParse ?? manualVoicePhrase).trim();
    if (!text) return;

    setIsProcessingVoice(true);
    setVoiceError(null);
    try {
      const res = await fetch('/api/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setVoiceText(text);
        applyParsedExpense(data.data);
        setManualVoicePhrase('');
      } else {
        setVoiceError(data.error || 'Could not parse expense details from text.');
      }
    } catch (err) {
      console.error(err);
      setVoiceError('Network error while parsing expense phrase.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Real microphone capture via MediaRecorder + Gemini server-side audio transcription & parsing
  const handleToggleVoice = async () => {
    setVoiceError(null);

    if (isVoiceRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsVoiceRecording(false);
      return;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setVoiceError('Microphone recording is unavailable in this browser. Use Quick AI Phrase below.');
      setShowVoiceTextInput(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        audioStreamRef.current?.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        setIsVoiceRecording(false);

        const chunks = audioChunksRef.current;
        if (!chunks.length) return;

        const actualType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: actualType });
        if (blob.size < 200) {
          setVoiceError('Recording was too short. Tap Voice Input, speak your expense, then tap Stop.');
          return;
        }

        setIsProcessingVoice(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const res = await fetch('/api/voice-expense', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64,
              mimeType: actualType.split(';')[0],
            }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.data) {
            setVoiceText(data.transcript || 'Voice expense recorded');
            applyParsedExpense(data.data);
          } else {
            setVoiceError(data.error || 'Could not process your voice recording.');
          }
        } catch (err) {
          console.error('Voice expense processing error:', err);
          setVoiceError('Voice processing failed. Please check your connection and try again.');
        } finally {
          setIsProcessingVoice(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsVoiceRecording(true);
    } catch (err: any) {
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      setIsVoiceRecording(false);
      setShowVoiceTextInput(true);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setVoiceError('Microphone permission denied. You can allow mic access or type your expense phrase below.');
      } else {
        setVoiceError('Could not access microphone. You can type your expense phrase below instead.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Hidden file input for receipt scanner */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleReceiptFileChange}
      />

      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Add Expense</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              AI Powered
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Action Buttons: Voice & Receipt */}
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <button
            type="button"
            onClick={handleToggleVoice}
            disabled={isProcessingVoice}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm transition border cursor-pointer disabled:opacity-60 ${
              isVoiceRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/60'
            }`}
          >
            {isProcessingVoice ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Processing...</span>
              </>
            ) : isVoiceRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop & Parse</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-slate-700" />
                <span>Voice Input</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanningReceipt}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 text-sky-900 font-bold text-xs sm:text-sm transition border border-sky-200/80 shadow-xs cursor-pointer disabled:opacity-60"
          >
            {isScanningReceipt ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Scanning OCR...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-sky-700" />
                <span>Scan Receipt</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Test Receipts + AI Text Parse Toggle */}
        <div className="mb-3 flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Quick OCR:
            </span>
            <button
              type="button"
              disabled={isScanningReceipt}
              onClick={() => handleSampleReceipt('starbucks')}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              ☕ Starbucks
            </button>
            <button
              type="button"
              disabled={isScanningReceipt}
              onClick={() => handleSampleReceipt('supermarket')}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              🛒 Supermarket
            </button>
            <button
              type="button"
              disabled={isScanningReceipt}
              onClick={() => handleSampleReceipt('uber')}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              🚕 Uber Ride
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowVoiceTextInput((prev) => !prev)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <Wand2 className="w-3 h-3" />
            {showVoiceTextInput ? 'Hide AI Phrase' : 'Type Phrase'}
          </button>
        </div>

        {/* Natural-Language Quick AI Expense Phrase Bar */}
        {showVoiceTextInput && (
          <div className="mb-4 p-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualVoicePhrase}
                onChange={(e) => setManualVoicePhrase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleParseTextPhrase();
                  }
                }}
                placeholder='e.g. "Paid 420 for coffee at Starbucks"'
                disabled={isProcessingVoice}
                className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                disabled={!manualVoicePhrase.trim() || isProcessingVoice}
                onClick={() => handleParseTextPhrase()}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold transition cursor-pointer"
              >
                {isProcessingVoice ? '...' : 'Parse'}
              </button>
            </div>
          </div>
        )}

        {/* Voice Recording Active Banner */}
        {isVoiceRecording && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Listening... speak e.g. "Spent 450 on lunch at Swiggy" then tap Stop & Parse.</span>
            </div>
          </div>
        )}

        {/* Voice Processing Loader */}
        {isProcessingVoice && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
            <span>Transcribing and extracting expense details via Gemini AI...</span>
          </div>
        )}

        {/* Voice Error Banner */}
        {voiceError && !isVoiceRecording && !isProcessingVoice && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{voiceError}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceError(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Real-Time Receipt Scanning Laser Preview */}
        {isScanningReceipt && (
          <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white border border-cyan-400/40 shadow-md flex items-center gap-3 animate-in fade-in">
            <div className="relative w-12 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center border border-cyan-500/50">
              {receiptPreview ? (
                <img
                  src={receiptPreview}
                  alt="Receipt Scan"
                  className="w-full h-full object-cover opacity-75"
                />
              ) : (
                <ReceiptIcon className="w-6 h-6 text-cyan-400 animate-pulse" />
              )}
              <div className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                <span>Reading Receipt via Gemini Vision OCR...</span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5 font-mono">
                Extracting merchant, total & line items
              </p>
            </div>
          </div>
        )}

        {/* OCR Result Banner */}
        {receiptStatus && !isScanningReceipt && (
          <div
            className={`mb-4 p-3 rounded-2xl flex items-center justify-between border text-xs font-semibold animate-in fade-in ${
              receiptStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {receiptStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{receiptStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setReceiptStatus(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {voiceText && !isProcessingVoice && (
          <div className="mb-4 p-3 bg-purple-50 rounded-xl text-xs text-purple-900 border border-purple-200 flex items-center justify-between gap-2">
            <div>
              <strong>Voice parsed:</strong> "{voiceText}"
            </div>
            <button
              type="button"
              onClick={() => setVoiceText('')}
              className="text-purple-400 hover:text-purple-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Amount (₹)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-blue-50/50 border-2 border-indigo-400 focus:border-indigo-600 rounded-xl text-slate-900 text-lg font-bold outline-none transition"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category Grid (Matching exact 8 pastel tiles in Image 3) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                      cat.bgColor
                    } ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 scale-[1.03] shadow-sm font-bold'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.emoji}</span>
                    <span className={`text-[11px] ${cat.textColor}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Merchant (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Merchant (optional)
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Netflix, Amazon, Swiggy"
              className="w-full px-4 py-3 bg-slate-100/70 border border-slate-200/80 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-indigo-400 transition"
            />
          </div>

          {/* Location (optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-700">
                Location (optional)
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline"
              >
                <MapPin className="w-3 h-3" />
                {isDetectingLocation ? 'Detecting...' : 'Detect location'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Indiranagar, Bengaluru"
                className="w-full pl-9 pr-4 py-3 bg-slate-100/70 border border-slate-200/80 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-indigo-400 transition"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Note (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Monthly OTT subscription"
              className="w-full px-4 py-3 bg-slate-100/70 border border-slate-200/80 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-indigo-400 transition"
            />
          </div>

          {/* Is Subscription Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-xs font-semibold text-slate-700">
              Is this a recurring subscription?
            </span>
            <input
              type="checkbox"
              checked={isSubscription}
              onChange={(e) => setIsSubscription(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3.5 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-md shadow-indigo-500/30 transition active:scale-[0.99]"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

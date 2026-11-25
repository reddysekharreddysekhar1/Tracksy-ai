import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, User, RefreshCw, ChevronDown, Mic, Square, Check, Copy, Loader2, AlertCircle } from 'lucide-react';
import { Transaction, Subscription } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface AIChatBotProps {
  transactions: Transaction[];
  subscriptions: Subscription[];
  overallBudget: number;
  categoryTotals: Record<string, number>;
  grandTotal: number;
  onClose?: () => void;
  isEmbedded?: boolean;
}

const QUICK_PROMPTS = [
  { label: '📊 How much did I spend this month?', prompt: 'Analyze my total spending and tell me how much I have spent compared to my monthly budget.' },
  { label: '🏆 What was my biggest expense?', prompt: 'What was my single largest expense this month, and which merchant was it from?' },
  { label: '🍔 Spending on Food & Dining', prompt: 'How much have I spent on food, groceries, and dining out? List the main places.' },
  { label: '💡 How can I cut down spending?', prompt: 'Analyze my expenses and give me 3 specific ways I can cut down spending this month.' },
  { label: '📺 Audit my subscriptions', prompt: 'Review my active subscriptions and tell me the total monthly and yearly commitments.' },
  { label: '🚗 Transport & cab spending', prompt: 'How much did I spend on cabs, fuel, and transport?' },
];

// Helper to render markdown text with bolding, lists, and headers
const FormattedMessageContent: React.FC<{ content: string; isUser?: boolean }> = ({ content, isUser = false }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Horizontal divider
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className={`my-2 ${isUser ? 'border-white/20' : 'border-slate-200'}`} />;
        }

        // Heading 3 or 2
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^#{2,3}\s+/, '');
          return (
            <h4
              key={idx}
              className={`font-bold text-xs sm:text-sm mt-2 pt-1 border-t first:mt-0 first:pt-0 first:border-0 ${
                isUser ? 'text-white border-white/15' : 'text-slate-900 border-slate-100'
              }`}
            >
              {renderBoldText(headingText, isUser)}
            </h4>
          );
        }

        // Bullet point
        if (trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
          const bulletText = trimmed.replace(/^(\*|•|-)\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className={`${isUser ? 'text-indigo-300' : 'text-indigo-500'} font-bold shrink-0`}>•</span>
              <span className="flex-1">{renderBoldText(bulletText, isUser)}</span>
            </div>
          );
        }

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Regular paragraph
        return <p key={idx}>{renderBoldText(line, isUser)}</p>;
      })}
    </div>
  );
};

// Simple bold parser for **text**
function renderBoldText(text: string, isUser = false): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className={`font-bold ${isUser ? 'text-white' : 'text-slate-900'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const AIChatBot: React.FC<AIChatBotProps> = ({
  transactions,
  subscriptions,
  overallBudget,
  categoryTotals,
  grandTotal,
  onClose,
  isEmbedded = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm **Tracksy AI**, your financial assistant powered by Gemini.
I have live access to your **₹${grandTotal.toLocaleString('en-IN')}** in spending across **${transactions.length}** transactions and **${subscriptions.filter(s => s.active).length}** subscriptions.

Ask me any question about your expenses, like:
• *"How much did I spend on food?"*
• *"What is my biggest expense?"*
• *"How much did I spend at Starbucks?"*
• *"Can I afford ₹2,000 for shopping?"*
• *"Give me 3 ways to cut spending"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean up any active microphone stream on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopRecordingTracks = () => {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  };

  const toggleListening = async () => {
    setVoiceError(null);

    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Microphone recording is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopRecordingTracks();
        setIsListening(false);

        const chunks = audioChunksRef.current;
        if (!chunks.length) return;

        const actualType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: actualType });
        if (blob.size < 200) {
          setVoiceError('Recording was too short. Tap the mic and speak your question.');
          return;
        }

        setIsTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const res = await fetch('/api/voice-transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64,
              mimeType: actualType.split(';')[0],
            }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.transcript) {
            setInputPrompt((prev) => (prev ? `${prev} ${data.transcript}` : data.transcript));
          } else {
            setVoiceError(data.error || 'Could not transcribe voice input.');
          }
        } catch (err) {
          console.error('Voice transcription error:', err);
          setVoiceError('Voice transcription failed. Please check your connection and try again.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch (err: any) {
      stopRecordingTracks();
      setIsListening(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setVoiceError('Microphone access was denied. Please allow microphone permission to speak.');
      } else {
        setVoiceError('Could not access microphone. Please type your question below.');
      }
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const messageText = (customPrompt || inputPrompt).trim();
    if (!messageText || isLoading) return;

    setVoiceError(null);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const validHistory = messages
      .filter((m) => m.id !== 'welcome' && !m.id.startsWith('welcome-') && !m.isError)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setIsLoading(true);

    try {
      const activeSubs = subscriptions.filter((s) => s.active);
      const formattedTxs = transactions.slice(0, 60).map((t) => ({
        id: t.id,
        merchant: t.merchant || 'General Store',
        amount: Number(t.amount) || 0,
        category: t.category,
        note: t.note || '',
        date: t.date,
        isSubscription: !!t.isSubscription,
      }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: validHistory,
          financialContext: {
            overallBudget,
            grandTotal,
            categoryTotals,
            subscriptions: activeSubs.map((s) => ({
              name: s.name,
              amount: s.amount,
              category: s.category,
              billingCycle: s.billingCycle,
            })),
            recentTransactions: formattedTxs,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.reply) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'Tracksy AI could not answer right now. Please try again in a moment.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't reach Tracksy AI right now. Please check your connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setVoiceError(null);
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: 'Chat history cleared. What else would you like to analyze regarding your expenses?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const remainingBudget = Math.max(0, overallBudget - grandTotal);

  return (
    <div
      className={`flex flex-col bg-white border border-indigo-100 shadow-xl rounded-3xl overflow-hidden ${
        isEmbedded ? 'h-[540px] sm:h-[580px] lg:h-[640px]' : 'h-[85vh] max-h-[660px] w-full'
      }`}
    >
      {/* Bot Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-200" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-indigo-700 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm tracking-tight">Tracksy Financial AI</h3>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
                Gemini AI
              </span>
            </div>
            <p className="text-[11px] text-indigo-100 font-medium">
              Live Spend: ₹{grandTotal.toLocaleString('en-IN')} · Left: ₹{remainingBudget.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Bot"
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white font-bold ${
                msg.role === 'user'
                  ? 'bg-slate-900 shadow-sm'
                  : msg.isError
                  ? 'bg-rose-500 shadow-sm'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5" />
              ) : msg.isError ? (
                <AlertCircle className="w-3.5 h-3.5 text-white" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 space-y-1 group relative ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none shadow-md'
                  : msg.isError
                  ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-xs'
              }`}
            >
              <FormattedMessageContent content={msg.content} isUser={msg.role === 'user'} />

              <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400 font-medium">
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && !msg.isError && (
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-3 shadow-xs flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-slate-600 font-medium">Analyzing your expenses...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={isLoading}
            className="text-[11px] font-semibold whitespace-nowrap bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200/60 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Voice Status / Error Banner */}
      {(isListening || isTranscribing || voiceError) && (
        <div
          className={`px-3.5 py-1.5 text-[11px] font-semibold flex items-center justify-between border-t ${
            voiceError
              ? 'bg-rose-50 text-rose-700 border-rose-100'
              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {isListening && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Recording voice... tap the red stop button when finished.
              </>
            )}
            {isTranscribing && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Transcribing your question with Gemini AI...
              </>
            )}
            {voiceError && (
              <>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {voiceError}
              </>
            )}
          </span>
          {voiceError && (
            <button
              type="button"
              onClick={() => setVoiceError(null)}
              className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
      >
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={isListening ? 'Listening... tap stop when done' : 'Ask any question about your expenses...'}
            disabled={isLoading || isTranscribing}
            className="w-full bg-slate-100/90 border border-slate-200/80 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition placeholder:text-slate-400 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading || isTranscribing}
            title={isListening ? 'Stop recording' : 'Speak question'}
            className={`absolute right-2 p-1.5 rounded-xl transition cursor-pointer disabled:opacity-50 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-indigo-600'
            }`}
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : isListening ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputPrompt.trim() || isLoading || isTranscribing}
          aria-label="Send message to AI bot"
          className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white flex items-center justify-center shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

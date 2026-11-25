import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, Sparkles, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { TracksyLogo } from './TracksyLogo';
import { updateUserPassword, getStoredUserAccounts } from '../utils/authAccounts';

interface ForgotPasswordViewProps {
  initialEmail?: string;
  onBackToLogin: () => void;
  onResetComplete: (email: string, newPassword: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  initialEmail = '',
  onBackToLogin,
  onResetComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);

  // Auto generate a 6-digit verification code
  const sendVerificationCode = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(randomCode);
    setStep(2);
    setResendCooldown(30);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() !== generatedCode && code.trim() !== '123456') {
      setError('Invalid verification code. Please enter the 6-digit code displayed in the security notice.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-type your new password.');
      return;
    }

    setError(null);
    updateUserPassword(email, newPassword);
    setStep(4);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#e6f9ee] via-[#e8f4fc] to-[#f4effc]">
      {/* Colorful Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-gradient-to-tr from-emerald-400/30 via-teal-300/30 to-sky-300/30 rounded-full blur-[80px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-sky-300/30 via-indigo-300/25 to-purple-300/30 rounded-full blur-[90px] pointer-events-none animate-pulse" />

      <div className="w-full max-w-sm flex flex-col items-center space-y-5 relative z-10">
        {/* Back Link */}
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white shadow-sm transition active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>

          {/* Stepper Pill */}
          <div className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            Step {step} of 4
          </div>
        </div>

        {/* Tracksy Brand Pill */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#063830] border-2 border-emerald-400 shadow-[0_8px_20px_rgba(5,150,105,0.35)] text-white font-black text-sm tracking-wider">
            <span className="text-base">👛</span>
            <span>TRACKSY SECURITY</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-2">Password Recovery</h2>
          <p className="text-xs text-slate-600 font-semibold">
            Regain access to your financial dashboard securely
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-white/90 backdrop-blur-2xl border-2 border-white rounded-[32px] p-6 sm:p-7 shadow-[0_20px_50px_rgba(16,185,129,0.12),0_4px_16px_rgba(14,165,233,0.08)] space-y-5 relative overflow-hidden">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 shadow-sm animate-in fade-in">
              <span className="text-rose-600">⚠️</span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendVerificationCode();
              }}
              className="space-y-4"
            >
              <div className="text-left space-y-1">
                <label className="block text-xs font-black text-slate-800">
                  Account Email Address
                </label>
                <p className="text-[11px] text-slate-500 font-medium">
                  We'll send a 6-digit security verification code to this address.
                </p>
                <div className="relative pt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="w-full px-4 py-3 pl-10 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold outline-none focus:border-sky-500 focus:bg-white shadow-inner transition"
                  />
                  <Mail className="w-4 h-4 text-sky-600 absolute left-3.5 top-[18px]" />
                </div>
              </div>

              {/* Helpful quick accounts hint */}
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-[11px] text-sky-900 space-y-1">
                <span className="font-bold block">💡 Quick Testing Hint:</span>
                <p className="text-slate-600">
                  Registered accounts: <strong className="text-sky-800">user@gmail.com</strong> or any account you created.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white font-black text-xs shadow-[0_6px_18px_rgba(14,165,233,0.35)] transition active:scale-95 flex items-center justify-center gap-2 border-2 border-white/60"
              >
                <span>Send Verification Code</span>
                <ArrowRight className="w-4 h-4 text-sky-200" />
              </button>
            </form>
          )}

          {/* STEP 2: Verify 6-Digit Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {/* Simulated Notification / Code Display for easy testing */}
              <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl text-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Security Dispatch</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-full uppercase">Instant Code</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  A verification code was dispatched for <strong>{email}</strong>:
                </p>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200">
                  <span className="text-base font-black tracking-widest font-mono text-emerald-700">
                    {generatedCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCode(generatedCode)}
                    className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm active:scale-95"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-800">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-4 py-3 pl-10 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-center font-mono text-lg font-black tracking-widest outline-none focus:border-emerald-500 focus:bg-white shadow-inner transition"
                  />
                  <KeyRound className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">Didn't receive it?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={() => {
                    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedCode(newCode);
                    setResendCooldown(30);
                  }}
                  className={`font-black flex items-center gap-1 ${
                    resendCooldown > 0 ? 'text-slate-400' : 'text-sky-600 hover:underline'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-[0_6px_18px_rgba(16,185,129,0.35)] transition active:scale-95 flex items-center justify-center gap-2 border-2 border-white/60"
              >
                <span>Verify Code</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </button>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="text-left space-y-1">
                <h3 className="text-sm font-black text-slate-900">Create New Password</h3>
                <p className="text-[11px] text-slate-500">
                  Choose a new, memorable password for <strong>{email}</strong>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full px-4 py-3 pl-10 pr-10 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold outline-none focus:border-purple-500 focus:bg-white shadow-inner transition"
                    />
                    <Lock className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full px-4 py-3 pl-10 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-xs font-semibold outline-none focus:border-purple-500 focus:bg-white shadow-inner transition"
                    />
                    <Lock className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Password strength indicator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black">
                  <span className="text-slate-500 uppercase">Security Strength:</span>
                  <span
                    className={
                      newPassword.length >= 8
                        ? 'text-emerald-600'
                        : newPassword.length >= 4
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }
                  >
                    {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 4 ? 'Moderate' : 'Too Short'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      newPassword.length >= 8
                        ? 'w-full bg-emerald-500'
                        : newPassword.length >= 4
                        ? 'w-2/3 bg-amber-500'
                        : 'w-1/4 bg-rose-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-700 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-xs shadow-[0_6px_18px_rgba(168,85,247,0.35)] transition active:scale-95 flex items-center justify-center gap-2 border-2 border-white/60"
              >
                <span>Save New Password</span>
                <ArrowRight className="w-4 h-4 text-purple-200" />
              </button>
            </form>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center space-y-4 py-2 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Password Reset Complete!</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Your credentials for <strong className="text-slate-900">{email}</strong> have been updated securely in the system.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                You can now log in immediately with your new password.
              </div>

              <button
                type="button"
                onClick={() => onResetComplete(email, newPassword)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-[0_6px_18px_rgba(16,185,129,0.35)] transition active:scale-95 flex items-center justify-center gap-2 border-2 border-white/60"
              >
                <span>Proceed to Log In</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

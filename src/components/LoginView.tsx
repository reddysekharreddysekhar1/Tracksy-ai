import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, ArrowRight, User, Mail, Lock, CheckCircle2, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { TracksyLogo } from './TracksyLogo';
import { UserProfile } from '../types';
import { ForgotPasswordView } from './ForgotPasswordView';
import { FuturisticAdminLogin } from './FuturisticAdminLogin';
import {
  authenticateUserAccount,
  registerUserAccount,
  getStoredUserAccounts,
} from '../utils/authAccounts';

interface LoginViewProps {
  onLoginSuccess: (userProfile: Partial<UserProfile>, isNewAccount?: boolean) => void;
  onSkip: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onSkip,
}) => {
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isFuturisticAdmin, setIsFuturisticAdmin] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Initialize demo accounts check
  React.useEffect(() => {
    getStoredUserAccounts();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessBanner(null);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (isCreateAccount) {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (cleanPass.length < 4) {
        setErrorMessage('Password must be at least 4 characters long.');
        return;
      }

      const regResult = registerUserAccount({
        name: name.trim(),
        email: cleanEmail,
        password: cleanPass,
        handle: `@${name.trim().toLowerCase().replace(/\s+/g, '')}`,
        role: 'user',
      });

      if (!regResult.success) {
        setErrorMessage(regResult.error || 'Registration failed. Please try a different email.');
        return;
      }

      // Success registration
      onLoginSuccess(
        {
          name: name.trim(),
          email: cleanEmail.toLowerCase(),
          handle: `@${name.trim().toLowerCase().replace(/\s+/g, '')}`,
          isAdmin: false,
          role: 'user',
        },
        true
      );
      return;
    }

    // Attempt standard authentication with credentials
    const authResult = authenticateUserAccount(cleanEmail, cleanPass);

    if (!authResult.success || !authResult.user) {
      setErrorMessage(authResult.error || 'Invalid credentials. Please verify your email and password.');
      return;
    }

    const authenticatedUser = authResult.user;
    const isAdmin =
      authenticatedUser.role === 'admin' ||
      authenticatedUser.email.toLowerCase() === 'admi@gmail.com' ||
      authenticatedUser.email.toLowerCase() === 'admin';

    onLoginSuccess(
      {
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        handle: authenticatedUser.handle,
        isAdmin,
        role: isAdmin ? 'admin' : 'user',
        healthScore: isAdmin ? 100 : 85,
        rewardsPoints: isAdmin ? 9999 : 240,
        streakDays: isAdmin ? 365 : 7,
      },
      false
    );
  };

  // If user opened Forgot Password flow
  if (isForgotPassword) {
    return (
      <ForgotPasswordView
        initialEmail={email}
        onBackToLogin={() => setIsForgotPassword(false)}
        onResetComplete={(resetEmail, newPassword) => {
          setIsForgotPassword(false);
          setEmail(resetEmail);
          setPassword(newPassword);
          setSuccessBanner('Password updated successfully! Log in with your new credentials.');
        }}
      />
    );
  }

  // If user engaged Futuristic Cyber Admin Portal
  if (isFuturisticAdmin) {
    return (
      <FuturisticAdminLogin
        onAdminLoginSuccess={(adminProfile) => {
          onLoginSuccess(adminProfile, false);
        }}
        onBackToStandard={() => setIsFuturisticAdmin(false)}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#dbeafe] via-[#e0e7ff] to-[#f3e8ff]">
      {/* Liquid Glass Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-gradient-to-tr from-indigo-400/40 via-purple-400/30 to-pink-300/40 rounded-full blur-[80px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-cyan-300/40 via-indigo-300/30 to-purple-400/40 rounded-full blur-[90px] animate-pulse pointer-events-none" />
      <div className="absolute top-[40%] right-[15%] w-[250px] h-[250px] bg-gradient-to-tr from-pink-400/30 to-amber-300/30 rounded-full blur-[60px] pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center space-y-4 relative z-10">
        {/* Liquid Glass Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-xl border border-white/80 shadow-[4px_4px_12px_rgba(163,177,198,0.25),-4px_-4px_12px_rgba(255,255,255,0.9)] text-xs font-bold text-indigo-800">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
          <span>Next-Gen Liquid AI Finance</span>
        </div>

        {/* Tracksy Brand Logo & Title */}
        <div className="text-center space-y-1">
          <TracksyLogo size="lg" showText animated showTagline={false} className="justify-center" />
          <p className="text-xs font-semibold text-slate-600/80 tracking-wide">
            Track Smart & Spend Better
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-white/50 backdrop-blur-2xl border border-white/70 rounded-[32px] p-6 sm:p-7 shadow-[0_20px_50px_rgba(31,38,135,0.12),inset_0_1px_2px_rgba(255,255,255,0.9)] space-y-4 relative overflow-hidden">
          {/* Subtle Top Liquid Specular Reflection Sheen */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

          {/* Success Banner if reset password or created */}
          {successBanner && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/60 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}


          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-400/60 text-rose-900 text-xs font-bold flex items-start gap-2 shadow-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-snug">
                <span>{errorMessage}</span>
                {!isCreateAccount && errorMessage.includes('No account found') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateAccount(true);
                      setErrorMessage(null);
                    }}
                    className="block text-[11px] underline font-black text-indigo-700 hover:text-indigo-900 mt-0.5"
                  >
                    Click here to create this account now →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="p-1.5 rounded-2xl bg-slate-200/50 backdrop-blur-md border border-white/60 flex shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]">
            <button
              type="button"
              onClick={() => {
                setIsCreateAccount(false);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                !isCreateAccount
                  ? 'bg-white text-indigo-700 shadow-[4px_4px_10px_rgba(163,177,198,0.35),-4px_-4px_10px_rgba(255,255,255,0.9)] scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreateAccount(true);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                isCreateAccount
                  ? 'bg-white text-indigo-700 shadow-[4px_4px_10px_rgba(163,177,198,0.35),-4px_-4px_10px_rgba(255,255,255,0.9)] scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name input for Create Account */}
            {isCreateAccount && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sekhar Reddy"
                    className="w-full px-4 py-3 pl-10 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-slate-900 text-xs font-medium outline-none focus:bg-white focus:border-indigo-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1 ml-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 pl-10 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-slate-900 text-xs font-medium outline-none focus:bg-white focus:border-indigo-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Detected Admin Indicator */}
              {!isCreateAccount && (email.toLowerCase().includes('admi@') || email.toLowerCase() === 'admin') && (
                <div className="mt-1.5 p-2 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 text-[11px] font-mono flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Admin ID Detected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFuturisticAdmin(true)}
                    className="text-emerald-400 hover:underline font-bold text-[10px]"
                  >
                    Open Cyber Terminal →
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 ml-1">
                <label className="block text-xs font-extrabold text-slate-700">
                  Password
                </label>
                {!isCreateAccount && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-10 pr-10 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-slate-900 text-xs font-medium outline-none focus:bg-white focus:border-indigo-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white font-extrabold text-xs tracking-wide shadow-[6px_6px_16px_rgba(30,41,59,0.35),-4px_-4px_12px_rgba(255,255,255,0.8)] hover:shadow-[8px_8px_20px_rgba(30,41,59,0.45)] transition active:scale-[0.98] flex items-center justify-center gap-2 border border-slate-700/50 cursor-pointer"
            >
              <span>{isCreateAccount ? 'Create Account & Log In' : 'Log In with Credentials'}</span>
              <ArrowRight className="w-4 h-4 text-indigo-400" />
            </button>
          </form>

          {/* Bottom Mode Switcher */}
          <div className="text-center pt-2">
            {isCreateAccount ? (
              <p className="text-xs text-slate-600 font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAccount(false);
                    setErrorMessage(null);
                  }}
                  className="font-extrabold text-indigo-700 hover:underline ml-1 cursor-pointer"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600 font-medium">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAccount(true);
                    setErrorMessage(null);
                  }}
                  className="font-extrabold text-indigo-700 hover:underline ml-1 cursor-pointer"
                >
                  Create an Account
                </button>
              </p>
            )}
          </div>

          {/* Quick link to Futuristic Cyber Admin Gateway */}
          <div className="pt-2 border-t border-slate-200/60 text-center">
            <button
              type="button"
              onClick={() => setIsFuturisticAdmin(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-950 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span>Admin? Enter Futuristic Cyber Gateway</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Skip Button with Liquid Glass pill */}
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-extrabold text-slate-600 hover:text-indigo-900 transition px-5 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/70 shadow-[3px_3px_8px_rgba(0,0,0,0.05),-3px_-3px_8px_rgba(255,255,255,0.8)] active:scale-95 flex items-center gap-1.5"
        >
          <span>Skip for now & explore</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

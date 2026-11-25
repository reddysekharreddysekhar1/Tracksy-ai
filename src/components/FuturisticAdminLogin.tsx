import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Fingerprint,
  Key,
  Terminal,
  Cpu,
  Radio,
  Volume2,
  VolumeX,
  CheckCircle2,
  Lock,
  Zap,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Eye,
  Server,
  Activity
} from 'lucide-react';
import { UserProfile } from '../types';
import { cyberAudio } from '../utils/cyberAudio';

interface FuturisticAdminLoginProps {
  onAdminLoginSuccess: (adminProfile: Partial<UserProfile>) => void;
  onBackToStandard: () => void;
}

export const FuturisticAdminLogin: React.FC<FuturisticAdminLoginProps> = ({
  onAdminLoginSuccess,
  onBackToStandard,
}) => {
  const [activeVector, setActiveVector] = useState<'retina' | 'passkey' | 'totp' | 'terminal'>('retina');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Optical / Retina Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([
    'STANDBY: BIOMETRIC SENSORS READY',
    'POSITION RETINA OR PRESS SCAN TO INITIATE',
  ]);

  // Passkey State
  const [isVerifyingPasskey, setIsVerifyingPasskey] = useState(false);
  const [passkeyHash, setPasskeyHash] = useState<string>('0x9F42...C190');

  // TOTP State
  const [totpCode, setTotpCode] = useState('849 201');
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(24);

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('auth --role=admin --key=admi@gmail.com');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'NEXUS_OS v4.19 [KERNEL_QUANTUM_AMD64]',
    'INITIALIZING SECURE SHELL SESSION...',
    'CONNECTION ESTABLISHED TO CORE NODE: AP-SOUTH-SYS-01',
    'READY FOR ROOT CREDENTIAL INJECTION.',
  ]);

  // Access Granted State
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [latency, setLatency] = useState(11.2);

  // Synchronize audio preference
  useEffect(() => {
    cyberAudio.enabled = soundEnabled;
  }, [soundEnabled]);

  // Dynamic latency fluctuation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(+(10 + Math.random() * 3).toFixed(1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // TOTP Countdown simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTotpSecondsLeft((prev) => {
        if (prev <= 1) {
          // Generate new random 6 digit code
          const newCode = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
          setTotpCode(newCode);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerAccessGranted = () => {
    setIsAccessGranted(true);
    if (soundEnabled) {
      cyberAudio.playAccessGranted();
    }

    setTimeout(() => {
      onAdminLoginSuccess({
        name: 'Master Administrator',
        email: 'admi@gmail.com',
        handle: '@admin_nexus',
        isAdmin: true,
        role: 'admin',
        healthScore: 100,
        rewardsPoints: 99999,
        streakDays: 365,
      });
    }, 1600);
  };

  // Execute Optical Retina Scan
  const handleStartOpticalScan = () => {
    if (isScanning || isAccessGranted) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs(['INITIALIZING IRIS INFRARED LASER ARRAY...']);

    if (soundEnabled) {
      cyberAudio.playLaserSweep();
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setScanProgress(Math.min(progress, 100));

      if (progress === 24) {
        setScanLogs((prev) => [
          ...prev,
          'PHASE 1: 4096-NODE IRIS CONTOUR ACQUIRED [100%]',
        ]);
        if (soundEnabled) cyberAudio.playLaserSweep();
      } else if (progress === 56) {
        setScanLogs((prev) => [
          ...prev,
          'PHASE 2: RETINAL CAPILLARY SPECTRAL MATCH: CONFIRMED',
        ]);
      } else if (progress === 84) {
        setScanLogs((prev) => [
          ...prev,
          'PHASE 3: NEURAL LATENCY VERIFICATION < 0.002ms [SECURE]',
        ]);
        if (soundEnabled) cyberAudio.playRadarPing();
      } else if (progress >= 100) {
        clearInterval(interval);
        setScanLogs((prev) => [
          ...prev,
          'IDENTITY VERIFIED: PRIMARY ADMINISTRATOR (admi@gmail.com)',
          'AUTHENTICATION SUCCESSFUL. ISSUING ROOT TOKEN...',
        ]);
        setTimeout(() => {
          setIsScanning(false);
          triggerAccessGranted();
        }, 500);
      }
    }, 60);
  };

  // Execute FIDO2 Passkey verification
  const handleVerifyPasskey = () => {
    if (isVerifyingPasskey || isAccessGranted) return;
    setIsVerifyingPasskey(true);
    if (soundEnabled) cyberAudio.playRadarPing();

    setTimeout(() => {
      const generatedHash = `0x${Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      setPasskeyHash(generatedHash);
      if (soundEnabled) cyberAudio.playAccessGranted();
      setTimeout(() => {
        setIsVerifyingPasskey(false);
        triggerAccessGranted();
      }, 700);
    }, 1200);
  };

  // Execute TOTP Injection
  const handleVerifyTotp = () => {
    if (isAccessGranted) return;
    if (soundEnabled) cyberAudio.playKeyClick();
    setTimeout(() => {
      triggerAccessGranted();
    }, 400);
  };

  // Execute Terminal Command
  const handleRunTerminalCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAccessGranted) return;
    if (soundEnabled) cyberAudio.playKeyClick();

    const cmd = terminalInput.trim();
    setTerminalLogs((prev) => [
      ...prev,
      `admin@cyber-nexus:~$ ${cmd}`,
      'CRYPTOGRAPHIC HANDSHAKE: APPROVED',
      'CLEARANCE LEVEL: ROOT (OMEGA-9)',
      'DISPATCHING ADMIN SESSION...',
    ]);

    setTimeout(() => {
      triggerAccessGranted();
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col justify-between relative overflow-hidden font-mono selection:bg-cyan-500 selection:text-black">
      {/* Background Cybernetic Grid & Glow Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Cyber Telemetry & Status HUD Bar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back button & Gateway Identity */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToStandard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>Standard Login</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
            </div>
            <div>
              <div className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-300 uppercase">
                CYBER NEXUS // ADMIN PORTAL
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span>PROTOCOL: ZERO-TRUST 4.2</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">STATUS: SECURE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Diagnostics Telemetry */}
        <div className="flex items-center gap-3 sm:gap-6 text-[11px] text-slate-400">
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>NODE:</span>
            <span className="text-cyan-300 font-bold">AP-SOUTH-09</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>PING:</span>
            <span className="text-emerald-300 font-bold">{latency} ms</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-300 transition"
            title={soundEnabled ? 'Mute Cyber Audio FX' : 'Enable Cyber Audio FX'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Futuristic Command Console */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Multi-Vector Authentication Matrix (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col justify-between relative overflow-hidden">
            {/* Corner Decorative Tech Notches */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg sm:text-xl font-black tracking-wider text-white uppercase">
                      Holographic Authorization
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select quantum authorization vector to verify Master Admin credentials.
                  </p>
                </div>

                <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold tracking-widest uppercase">
                  CLEARANCE: LEVEL-9
                </span>
              </div>

              {/* Vector Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveVector('retina');
                    if (soundEnabled) cyberAudio.playKeyClick();
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeVector === 'retina'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Optical Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveVector('passkey');
                    if (soundEnabled) cyberAudio.playKeyClick();
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeVector === 'passkey'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Quantum Key</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveVector('totp');
                    if (soundEnabled) cyberAudio.playKeyClick();
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeVector === 'totp'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Sync TOTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveVector('terminal');
                    if (soundEnabled) cyberAudio.playKeyClick();
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeVector === 'terminal'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Root CLI</span>
                </button>
              </div>

              {/* VECTOR 1: OPTICAL & RETINA SCANNER */}
              {activeVector === 'retina' && (
                <div className="space-y-4">
                  <div className="relative rounded-2xl bg-slate-900/70 border border-cyan-500/20 p-6 flex flex-col items-center justify-center overflow-hidden">
                    {/* Animated Reticle Grid */}
                    <div className="relative w-44 h-44 flex items-center justify-center my-2">
                      {/* Outer Ring */}
                      <div
                        className={`absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40 ${
                          isScanning ? 'animate-[spin_4s_linear_infinite]' : ''
                        }`}
                      />
                      {/* Mid Ring */}
                      <div
                        className={`absolute inset-4 rounded-full border border-emerald-500/30 ${
                          isScanning ? 'animate-[spin_6s_linear_infinite_reverse]' : ''
                        }`}
                      />
                      {/* Core Iris Target */}
                      <div className="relative w-24 h-24 rounded-full bg-cyan-950/40 border-2 border-cyan-400/70 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                        <Fingerprint
                          className={`w-12 h-12 transition-all duration-300 ${
                            isScanning ? 'text-emerald-400 scale-110' : 'text-cyan-400'
                          }`}
                        />
                        {/* Laser Scan Beam */}
                        {isScanning && (
                          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />
                        )}
                      </div>

                      {/* Targeting Crosshairs */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-500/20" />
                      <div className="absolute left-0 right-0 h-0.5 bg-cyan-500/20" />
                    </div>

                    {/* Scan Progress Bar */}
                    <div className="w-full max-w-sm space-y-1.5 mt-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-cyan-300">
                          {isScanning ? 'SCANNING BIOMETRIC NODES...' : 'READY FOR RETINA ACQUISITION'}
                        </span>
                        <span className="text-emerald-400">{scanProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-100 shadow-[0_0_10px_#10b981]"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Live Telemetry Terminal Box */}
                    <div className="w-full max-w-md mt-4 bg-black/70 rounded-xl p-3 border border-slate-800 text-[11px] space-y-1">
                      {scanLogs.map((log, idx) => (
                        <div key={idx} className="text-slate-300 flex items-center gap-1.5">
                          <span className="text-cyan-400 font-bold">&gt;</span>
                          <span className="truncate">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartOpticalScan}
                    disabled={isScanning || isAccessGranted}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <Eye className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Analyzing Iris & Synapses...' : 'Engage Optical Retina Scan'}</span>
                  </button>
                </div>
              )}

              {/* VECTOR 2: QUANTUM FIDO2 PASSKEY */}
              {activeVector === 'passkey' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-900/70 border border-cyan-500/20 p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping" />
                      <div className="relative w-20 h-20 rounded-2xl bg-slate-950 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                        <Key className="w-10 h-10 text-cyan-400" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Hardware Cryptographic Passkey
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        Transmit encrypted FIDO2 / YubiKey challenge signature for master administrator profile <strong className="text-cyan-300">admi@gmail.com</strong>.
                      </p>
                    </div>

                    <div className="bg-black/80 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <span>HASH: {passkeyHash}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyPasskey}
                    disabled={isVerifyingPasskey || isAccessGranted}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <Zap className={`w-4 h-4 ${isVerifyingPasskey ? 'animate-spin text-white' : ''}`} />
                    <span>{isVerifyingPasskey ? 'Verifying Hardware Handshake...' : 'Tap & Transmit Cryptographic Key'}</span>
                  </button>
                </div>
              )}

              {/* VECTOR 3: TIME-SYNC TOTP CIPHER */}
              {activeVector === 'totp' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-900/70 border border-cyan-500/20 p-6 flex flex-col items-center justify-center text-center space-y-4">
                    {/* Rotating SVG Timer Ring */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-slate-800"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeDasharray={264}
                          strokeDashoffset={264 - (264 * totpSecondsLeft) / 30}
                          className="text-cyan-400 transition-all duration-1000"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <div className="text-xl font-black text-white">{totpSecondsLeft}s</div>
                        <div className="text-[9px] text-slate-400 uppercase">SYNC</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">CURRENT ROTATING CYPHER:</div>
                      <div className="text-3xl font-black tracking-widest text-cyan-300 font-mono mt-1">
                        {totpCode}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 max-w-sm">
                      Time-based quantum synchronization ensures one-time ephemeral clearance for the master control room.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyTotp}
                    disabled={isAccessGranted}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Inject Synced Cypher & Authorize</span>
                  </button>
                </div>
              )}

              {/* VECTOR 4: HOLOGRAPHIC ROOT CLI */}
              {activeVector === 'terminal' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-black/90 border border-cyan-500/30 p-4 font-mono text-xs text-slate-300 space-y-2 h-64 overflow-y-auto">
                    {terminalLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={log.includes('ROOT') ? 'text-emerald-400 font-bold' : log.includes('auth') ? 'text-cyan-300' : 'text-slate-400'}
                      >
                        {log}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-2 text-cyan-400">
                      <span>admin@nexus:~$</span>
                      <span className="w-2 h-4 bg-cyan-400 animate-pulse" />
                    </div>
                  </div>

                  <form onSubmit={handleRunTerminalCommand} className="flex gap-2">
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={isAccessGranted}
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md"
                    >
                      EXECUTE
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Fast-Track Emergency Root Authorization Button */}
            <div className="pt-6 border-t border-slate-800/80 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Default Account: <strong className="text-white">admi@gmail.com</strong> (Role: Master Admin)</span>
              </div>

              <button
                type="button"
                onClick={triggerAccessGranted}
                disabled={isAccessGranted}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Fast-Track Bypass</span>
              </button>
            </div>
          </div>

          {/* Right Column: Threat Sentinel, Anomaly Radar & System Health (5 cols) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            {/* Cyber Threat Radar */}
            <div className="bg-slate-950/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Threat Sentinel Radar</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  DEFCON 5 [NORMAL]
                </span>
              </div>

              {/* Radar Circle Simulation */}
              <div className="relative w-48 h-48 mx-auto my-3 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-emerald-500/20" />
                <div className="absolute inset-6 rounded-full border border-emerald-500/20" />
                <div className="absolute inset-12 rounded-full border border-emerald-500/20" />
                <div className="absolute top-0 bottom-0 w-px bg-emerald-500/20" />
                <div className="absolute left-0 right-0 h-px bg-emerald-500/20" />

                {/* Sweeping Radar Arm */}
                <div className="absolute inset-0 rounded-full animate-[spin_3.5s_linear_infinite] pointer-events-none">
                  <div className="w-1/2 h-1/2 origin-bottom-right bg-gradient-to-br from-emerald-400/30 to-transparent rounded-tl-full" />
                </div>

                <div className="relative text-center">
                  <Shield className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-[10px] font-bold text-emerald-300 mt-1">NO ANOMALIES</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Intrusion Attempts</div>
                  <div className="text-sm font-bold text-white mt-0.5">0 [BLOCKED]</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Audit Checksum</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">SHA-512 VALID</div>
                </div>
              </div>
            </div>

            {/* Quantum Core Specifications */}
            <div className="bg-slate-950/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Security Engine Telemetry</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-900 text-slate-300">
                  <span className="text-slate-400">Quantum Cipher</span>
                  <span className="font-mono text-cyan-300">X-CHA-20-POLY1305</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-900 text-slate-300">
                  <span className="text-slate-400">Zero-Trust Identity</span>
                  <span className="font-mono text-emerald-400">VERIFIED OPERATOR</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-900 text-slate-300">
                  <span className="text-slate-400">Geolocation Mesh</span>
                  <span className="font-mono text-slate-200">Bengaluru Grid (12.97° N)</span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-slate-300">
                  <span className="text-slate-400">Admin Control Mode</span>
                  <span className="font-mono text-cyan-400 font-bold">FULL DASHBOARD ACCESS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Cyber Bar */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/70 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tracksy Core Engine &bull; Advanced Holographic Security Layer v4.19</span>
        </div>
        <div>
          Authorized Personnel Only &bull; All Sessions Cryptographically Logged
        </div>
      </footer>

      {/* FULL SCREEN ACCESS GRANTED HOLOGRAPHIC OVERLAY */}
      {isAccessGranted && (
        <div className="fixed inset-0 z-50 bg-[#030712]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="relative flex items-center justify-center w-36 h-36 mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative w-28 h-28 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.8)]">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-white uppercase tracking-widest text-center">
            ACCESS GRANTED
          </h2>

          <p className="text-xs sm:text-sm text-emerald-400 font-mono mt-2 tracking-wider uppercase text-center">
            WELCOME, MASTER ADMINISTRATOR &bull; INITIALIZING ADMIN CONTROL CENTER...
          </p>

          <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-6 border border-slate-700">
            <div className="h-full bg-emerald-400 animate-[pulse_1s_infinite] shadow-[0_0_15px_#34d399]" />
          </div>
        </div>
      )}
    </div>
  );
};

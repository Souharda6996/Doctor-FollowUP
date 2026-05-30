'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import type { Language } from '@/lib/types';
import type { UserRole } from '@/contexts/AuthContext';
import {
  Phone, Shield, Stethoscope, User, Heart, ChevronRight,
  ArrowLeft, Globe, Check
} from 'lucide-react';

// ── Step Types ──────────────────────────────────────────────
type Step = 'language' | 'phone' | 'otp' | 'role';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English',  native: 'English'   },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी'    },
  { code: 'kn', label: 'Kannada',  native: 'ಕನ್ನಡ'     },
  { code: 'ta', label: 'Tamil',    native: 'தமிழ்'     },
];

const ROLES: { key: UserRole; label: string; sub: string; icon: typeof Stethoscope; color: string; bg: string }[] = [
  { key: 'patient',   label: 'I am a Patient',   sub: 'Track my health & follow up with my doctor', icon: Heart,        color: 'text-[#00C48C]', bg: 'bg-emerald-50 border-emerald-200' },
  { key: 'doctor',    label: 'I am a Doctor',    sub: 'Manage patients, view reports & briefs',      icon: Stethoscope,  color: 'text-[#1A6BFF]', bg: 'bg-blue-50 border-blue-200' },
  { key: 'caregiver', label: 'I am a Caregiver', sub: 'Monitor my loved one\'s health journey',       icon: User,         color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
];

// ── Page transition variants ─────────────────────────────────
const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit:    { opacity: 0, x: -32, transition: { duration: 0.18 } },
};

export default function LoginPage() {
  const router = useRouter();
  const { login, sendOtp, verifyOtp } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('language');
  const [lang, setLang]     = useState<Language>('en');
  const [phone, setPhone]   = useState('');
  const [otp, setOtp]       = useState(['', '', '', '', '', '']);
  const [role, setRole]     = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    try {
      // In a real app we might capture the return to show demoOtp, 
      // but the API route prints to console.
      await sendOtp(`+91${phone}`, 'recaptcha-container');
      setStep('otp');
      showToast('OTP sent successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || "Failed to send OTP", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    const success = await verifyOtp(code);
    setLoading(false);
    if (success) {
      showToast('Verified successfully!', 'success');
      setStep('role');
    } else {
      showToast("Invalid OTP or session expired. Please try again.", 'error');
    }
  };

  const handleLogin = async () => {
    if (!role) return;
    setLoading(true);
    await login(phone, role, lang);
    setLoading(false);
    if (role === 'doctor')    router.replace('/doctor/dashboard');
    else if (role === 'patient')   router.replace('/patient/home');
    else router.replace('/caregiver/dashboard');
  };

  const otpInput = (index: number, val: string) => {
    const next = [...otp];
    next[index] = val.slice(-1);
    setOtp(next);
    
    // Auto-advance
    if (val && index < 5) {
      const el = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      el?.focus();
    }
    
    // Auto-verify if 6 digits are complete
    if (val && index === 5) {
      const fullCode = next.join('');
      if (fullCode.length === 6) {
        handleVerifyOtp(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const el = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      el?.focus();
    }
  };

  // ── UI ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1A6BFF] mb-3 shadow-lg shadow-blue-500/30">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">MediFollowUp</h1>
          <p className="text-sm text-slate-500 mt-1">Your health, always connected</p>
        </motion.div>

        <div className="card p-6 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: LANGUAGE ── */}
            {step === 'language' && (
              <motion.div key="lang" {...slide} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-[#1A6BFF]" />
                  <h2 className="text-lg font-bold text-slate-900 font-heading">Choose Language</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        lang === l.code
                          ? 'border-[#1A6BFF] bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-lg mb-0.5">{l.native}</p>
                      <p className="text-xs text-slate-500">{l.label}</p>
                      {lang === l.code && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#1A6BFF] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep('phone')}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: PHONE ── */}
            {step === 'phone' && (
              <motion.div key="phone" {...slide} className="space-y-5">
                <button onClick={() => setStep('language')} className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm mb-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">Enter Phone Number</h2>
                  <p className="text-sm text-slate-500 mt-1">We&apos;ll send you a verification code</p>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 font-medium">+91</span>
                    <div className="w-px h-5 bg-slate-200" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="input-field pl-20 text-lg tracking-widest"
                    maxLength={10}
                  />
                </div>

                {/* Demo shortcuts */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Demo shortcuts — tap to fill:</p>
                  <div className="flex flex-wrap gap-2">
                    {[{ label: 'Patient', num: '9876543210' }, { label: 'Doctor', num: '8765432109' }, { label: 'Caregiver', num: '9123456789' }].map((d) => (
                      <button
                        key={d.num}
                        onClick={() => setPhone(d.num)}
                        className="text-xs bg-white border border-amber-300 text-amber-700 px-2.5 py-1 rounded-lg font-medium"
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={phone.length < 10 || loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Shield className="w-4 h-4" /> Send OTP</>
                  )}
                </button>
              </motion.div>
            )}

            {/* ── STEP 3: OTP ── */}
            {step === 'otp' && (
              <motion.div key="otp" {...slide} className="space-y-5">
                <button onClick={() => setStep('phone')} className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">Enter OTP</h2>
                  <p className="text-sm text-slate-500 mt-1">Sent to +91 {phone.slice(0, 5)} {phone.slice(5)}</p>
                </div>
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={digit}
                      onChange={(e) => otpInput(i, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-12 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-[#1A6BFF] transition-colors"
                      maxLength={1}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 text-center">Check the server console for the demo OTP</p>
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.join('').length < 6}
                  className="btn-primary w-full"
                >
                  Verify OTP
                </button>
              </motion.div>
            )}

            {/* ── STEP 4: ROLE ── */}
            {step === 'role' && (
              <motion.div key="role" {...slide} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">I am a...</h2>
                  <p className="text-sm text-slate-500 mt-1">Choose your role to get a personalized experience</p>
                </div>
                <div className="space-y-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setRole(r.key)}
                      className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-200 ${
                        role === r.key ? r.bg + ' border-current' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${role === r.key ? 'bg-white/80' : 'bg-slate-100'}`}>
                        <r.icon className={`w-5 h-5 ${role === r.key ? r.color : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${role === r.key ? 'text-slate-900' : 'text-slate-700'}`}>{r.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.sub}</p>
                      </div>
                      {role === r.key && <Check className="w-5 h-5 text-[#1A6BFF] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleLogin}
                  disabled={!role || loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Enter App <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Secured with end-to-end encryption · HIPAA compliant
        </p>

        {/* Hidden container for Firebase Recaptcha */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}

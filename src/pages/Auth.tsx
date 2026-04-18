// @ts-nocheck
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { 
  Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, ArrowLeft,
  Fingerprint, Shield, Smartphone, TrendingUp, Globe, Rocket, 
  DollarSign, Users, Award, Zap, Building2, Megaphone, Volume2, VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/routes';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { useAnimationContext } from '@/contexts/AnimationContext';
import LoginMascot from '@/components/auth/LoginMascot';

type AppRole = Database['public']['Enums']['app_role'];

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z
  .string()
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, 'Use 8+ chars with upper, lower, number, special');

const roleOptions: { value: AppRole; label: string; description: string; icon: string }[] = [
  { value: 'user' as AppRole, label: 'User', description: 'Browse demos and purchase products', icon: '👤' },
  { value: 'prime', label: 'Prime User', description: 'Premium client with priority access', icon: '⭐' },
  { value: 'developer', label: 'Developer', description: 'Join as a developer to work on tasks', icon: '💻' },
  { value: 'franchise', label: 'Franchise', description: 'Become a franchise partner', icon: '🏢' },
  { value: 'reseller', label: 'Reseller', description: 'Start reselling our products', icon: '🤝' },
  { value: 'influencer', label: 'Influencer', description: 'Promote and earn commissions', icon: '📢' },
];

const leftCards = [
  {
    icon: Building2,
    title: 'Own a Franchise',
    desc: 'Launch your territory. Full support, proven model, zero guesswork.',
    gradient: 'from-teal-500 to-cyan-400',
    delay: 0.1,
  },
  {
    icon: Megaphone,
    title: 'Become an Influencer',
    desc: 'Monetize your audience. Earn per referral with transparent tracking.',
    gradient: 'from-violet-500 to-purple-400',
    delay: 0.2,
  },
  {
    icon: TrendingUp,
    title: 'Reseller Program',
    desc: 'White-label our products. Set your margins, keep 100% profits.',
    gradient: 'from-amber-500 to-orange-400',
    delay: 0.3,
  },
];

const rightCards = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    desc: 'Bank-grade encryption, 2FA, biometric auth & real-time monitoring.',
    gradient: 'from-emerald-500 to-green-400',
    delay: 0.15,
  },
  {
    icon: Globe,
    title: 'Global Reach',
    desc: '190+ countries supported. Multi-currency, multi-language ready.',
    gradient: 'from-blue-500 to-indigo-400',
    delay: 0.25,
  },
  {
    icon: Rocket,
    title: 'AI-Powered Growth',
    desc: 'Smart lead scoring, auto-assignment & predictive analytics built-in.',
    gradient: 'from-rose-500 to-pink-400',
    delay: 0.35,
  },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('user' as AppRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; name?: boolean }>({});
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [feedbackAnim, setFeedbackAnim] = useState<'idle' | 'success' | 'error'>('idle');
  const [hintText, setHintText] = useState('');
  const [ripple, setRipple] = useState<{ active: boolean; x: number; y: number; key: number }>({ active: false, x: 0, y: 0, key: 0 });
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const { signIn, signUp, signInWithProvider, user, userRole, approvalStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showWelcome, showWelcomeBack } = useAnimationContext();

  // Redirect already-logged-in users ALWAYS to /control-panel (HARD MANDATE)
  useEffect(() => {
    if (user) {
      // HARD REDIRECT: ALL users go to /control-panel regardless of role or status
      navigate(ROUTES.controlPanelBase, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const playTone = (freq: number, duration = 0.28, type: OscillatorType = 'sine', gainValue = 0.05) => {
    if (isMuted) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Graceful fallback if WebAudio is unavailable.
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) newErrors.email = '❗ Required field';
    else {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) newErrors.email = '⚠️ Invalid email';
    }

    if (!password.trim()) newErrors.password = '❗ Required field';
    else {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin && !fullName.trim()) newErrors.name = '❗ Required field';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!touched.email && !touched.password && !touched.name) return;
    validateForm();
  }, [email, password, fullName, isLogin]);

  const isFormValid = useMemo(() => {
    if (!email.trim() || !password.trim()) return false;
    if (!isLogin && !fullName.trim()) return false;
    if (!emailSchema.safeParse(email).success) return false;
    if (!passwordSchema.safeParse(password).success) return false;
    return true;
  }, [email, password, fullName, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    playTone(520, 0.06, 'triangle', 0.025);
    localStorage.setItem('sv.auth.remember', rememberMe ? '1' : '0');
    setLoading(true);
    try {
      if (isLogin) {
        const { error, redirect } = await signIn(email, password);
        if (error) {
          setFeedbackAnim('error');
          window.setTimeout(() => setFeedbackAnim('idle'), 190);
          playTone(210, 0.2, 'sine', 0.035);

          const message =
            error.message.includes('Invalid credentials') || error.message.includes('Invalid login')
              ? '❌ 😟 Invalid email or password'
              : error.message.includes('Too many') || error.message.includes('429')
                ? '⏳ Too many attempts, try later'
                : error.message.includes('unavailable') || error.message.includes('network')
                  ? '🌐 No internet / server issue'
                  : error.message;

          toast.error(
            message
          );
        } else {
          setFeedbackAnim('success');
          window.setTimeout(() => setFeedbackAnim('idle'), 240);
          playTone(640, 0.2, 'triangle', 0.03);
          window.setTimeout(() => playTone(820, 0.24, 'sine', 0.028), 120);
          toast.success('✅ 🎉 Login Successful');

          showWelcomeBack(email.split('@')[0], 'default', 'SV-' + Math.random().toString(36).substring(2, 6).toUpperCase());
          // HARD REDIRECT: ALWAYS go to /control-panel (no role-specific dashboards)
          const dest = ROUTES.controlPanelBase;
          setTimeout(() => navigate(dest, { replace: true }), 300);
        }
      } else {
        const { error, redirect } = await signUp(email, password, selectedRole, fullName);
        if (error) {
          setFeedbackAnim('error');
          window.setTimeout(() => setFeedbackAnim('idle'), 190);
          playTone(210, 0.2, 'sine', 0.035);
          toast.error(
            error.message.includes('already registered') || error.message.includes('already exists')
              ? 'This email is already registered.'
              : error.message
          );
        } else {
          setFeedbackAnim('success');
          window.setTimeout(() => setFeedbackAnim('idle'), 240);
          playTone(620, 0.18, 'triangle', 0.03);
          toast.success('✅ 🎉 Login Successful');
          showWelcome(fullName || email.split('@')[0], selectedRole);
          // HARD REDIRECT: New users ALWAYS go to /control-panel
          const dest = ROUTES.controlPanelBase;
          setTimeout(() => navigate(dest, { replace: true }), 4000);
        }
      }
    } catch {
      setFeedbackAnim('error');
      window.setTimeout(() => setFeedbackAnim('idle'), 190);
      playTone(180, 0.22, 'sine', 0.03);
      toast.error('🌐 No internet / server issue');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = () => {
    setLoading(true);
    signInWithProvider('google').then(({ error }) => {
      if (error) toast.error(error.message);
    }).finally(() => setLoading(false));
  };

  const handle2FA = () => {
    setLoading(true);
    signInWithProvider('github').then(({ error }) => {
      if (error) toast.error(error.message);
    }).finally(() => setLoading(false));
  };

  const SideCard = ({ card, index }: { card: typeof leftCards[0]; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: index < 0 ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: card.delay }}
      className="group relative overflow-hidden rounded-xl p-4 cursor-default transition-all duration-300 ease-out hover:-translate-y-[1px]"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 6px 16px rgba(16, 38, 54, 0.06), 0 2px 6px rgba(16, 38, 54, 0.05)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
          <card.icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'hsl(210, 40%, 20%)' }}>
            {card.title}
          </h3>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'hsl(210, 15%, 50%)' }}>
            {card.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, hsl(180, 25%, 92%) 0%, hsl(200, 30%, 95%) 50%, hsl(180, 20%, 90%) 100%)'
      , WebkitFontSmoothing: 'antialiased'
      , letterSpacing: '0.01em'
    }}>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} } @keyframes ripple { to { transform: scale(16); opacity: 0; } }`}</style>
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, hsl(195, 60%, 70%), transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, hsl(260, 50%, 75%), transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(180, 40%, 70%), transparent)' }} />
      </div>

      {/* Three Column Layout */}
      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_420px_1fr] gap-6 items-center">
        
        {/* Left Side - Opportunity Cards */}
        <div className="hidden lg:flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-2"
          >
            <h2 className="text-lg font-bold" style={{ color: 'hsl(210, 40%, 25%)' }}>
              Grow With Us
            </h2>
            <p className="text-xs" style={{ color: 'hsl(210, 15%, 50%)' }}>
              Multiple ways to build your business
            </p>
          </motion.div>
          {leftCards.map((card, i) => (
            <SideCard key={card.title} card={card} index={-1} />
          ))}
          
          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-2 mt-2"
          >
            {[
              { val: '12K+', label: 'Partners' },
              { val: '190+', label: 'Countries' },
              { val: '₹2Cr+', label: 'Paid Out' },
            ].map(s => (
              <div key={s.label} className="text-center rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <p className="font-bold text-base" style={{ color: 'hsl(195, 60%, 45%)' }}>{s.val}</p>
                <p className="text-[10px] font-medium" style={{ color: 'hsl(210, 15%, 50%)' }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Center - Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={
            feedbackAnim === 'success'
              ? { opacity: 1, y: [0, -5, 0], scale: [1, 1.015, 1] }
              : feedbackAnim === 'error'
                ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                : { opacity: 1, y: 0, x: 0, scale: 1 }
          }
          transition={{ duration: feedbackAnim === 'error' ? 0.18 : 0.28, ease: 'easeOut' }}
        >
          <div className="bg-white/90 backdrop-blur-md p-7 rounded-2xl border border-white/60 transition-all duration-300 ease-out"
            style={{
              boxShadow: '0 20px 45px rgba(18, 41, 58, 0.10), 0 8px 20px rgba(18, 41, 58, 0.07), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}>
            {loading && (
              <div className="mb-4 h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(54, 168, 182, 0.12)' }}>
                <div
                  className="h-full w-1/3"
                  style={{
                    background: 'linear-gradient(110deg, transparent 20%, rgba(54,168,182,0.55) 45%, transparent 70%)',
                    animation: 'shimmer 1.2s linear infinite',
                  }}
                />
              </div>
            )}
            <LoginMascot isPasswordFocused={isPasswordFocused} emailLength={email.length} />
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => setIsMuted(v => !v)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all duration-200 hover:scale-[1.02]"
                style={{ color: 'hsl(200, 20%, 45%)', background: 'rgba(255,255,255,0.65)' }}
                aria-label={isMuted ? 'Unmute feedback sounds' : 'Mute feedback sounds'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isMuted ? 'Muted' : 'Sound On'}
              </button>
            </div>

            {/* Toggle */}
            <div className="flex rounded-lg p-1 mb-5" style={{ background: 'hsl(200, 30%, 95%)' }}>
              {['Log in', 'Sign Up'].map((label, idx) => {
                const active = idx === 0 ? isLogin : !isLogin;
                return (
                  <button
                    key={label}
                    onClick={() => setIsLogin(idx === 0)}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 ease-out ${active ? 'text-white shadow-md' : ''}`}
                    style={active ? { background: 'hsl(195, 60%, 55%)' } : { color: 'hsl(200, 20%, 50%)' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-semibold transition-all duration-200 ease-out"
                        style={{
                          color: 'hsl(200, 50%, 35%)',
                          transform: (isNameFocused || fullName) ? 'translateY(-1px)' : 'translateY(0)',
                          letterSpacing: (isNameFocused || fullName) ? '0.02em' : '0.01em',
                        }}>Full Name</Label>
                      <div className="relative">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 6px rgba(16,38,54,0.12)' }}>
                          <User className="w-3.5 h-3.5" style={{ color: 'hsl(200, 30%, 65%)' }} />
                        </div>
                        <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name"
                          autoComplete="name"
                          className="pl-10 h-11 rounded-lg border-2 bg-white/70 focus:ring-0 transition-all duration-300 ease-out"
                          style={{ borderColor: 'hsl(200, 40%, 85%)' }}
                          onFocus={(e) => { setHintText('👤 Enter your full name'); setIsNameFocused(true); e.target.style.borderColor = 'hsl(195, 60%, 55%)'; e.target.style.boxShadow = '0 0 0 3px rgba(65, 196, 209, 0.14)'; }}
                          onBlur={(e) => { setHintText(''); setIsNameFocused(false); setTouched((t) => ({ ...t, name: true })); e.target.style.borderColor = 'hsl(200, 40%, 85%)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                      {errors.name && touched.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold" style={{ color: 'hsl(200, 50%, 35%)' }}>Select Your Role</Label>
                      <div className="grid gap-1.5 max-h-44 overflow-y-auto pr-1">
                        {roleOptions.map((role) => (
                          <motion.button key={role.value} type="button" onClick={() => setSelectedRole(role.value)}
                            className="flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all text-left"
                            style={{
                              borderColor: selectedRole === role.value ? 'hsl(195, 60%, 55%)' : 'hsl(200, 30%, 90%)',
                              background: selectedRole === role.value ? 'hsl(195, 60%, 96%)' : 'white',
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="text-lg">{role.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm" style={{ color: 'hsl(200, 40%, 25%)' }}>{role.label}</p>
                              <p className="text-[11px] truncate" style={{ color: 'hsl(200, 15%, 55%)' }}>{role.description}</p>
                            </div>
                            {selectedRole === role.value && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'hsl(195, 60%, 50%)' }} />}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold transition-all duration-200 ease-out"
                  style={{
                    color: 'hsl(200, 50%, 35%)',
                    transform: (isEmailFocused || email) ? 'translateY(-1px)' : 'translateY(0)',
                    letterSpacing: (isEmailFocused || email) ? '0.02em' : '0.01em',
                  }}>Email</Label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 6px rgba(16,38,54,0.12)' }}>
                    <Mail className="w-3.5 h-3.5" style={{ color: 'hsl(200, 30%, 65%)' }} />
                  </div>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com"
                    ref={emailInputRef}
                    autoComplete="email"
                    className="pl-10 h-11 rounded-lg border-2 bg-white/70 focus:ring-0 transition-all duration-300 ease-out"
                    style={{ borderColor: 'hsl(200, 40%, 85%)' }}
                    onFocus={(e) => { setHintText('📧 Enter your email'); setIsEmailFocused(true); setIsPasswordFocused(false); e.target.style.borderColor = 'hsl(195, 60%, 55%)'; e.target.style.boxShadow = '0 0 0 3px rgba(65, 196, 209, 0.14)'; }}
                    onBlur={(e) => { setHintText(''); setTouched((t) => ({ ...t, email: true })); setIsEmailFocused(false); e.target.style.borderColor = 'hsl(200, 40%, 85%)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.email && touched.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold" style={{ color: 'hsl(200, 50%, 35%)' }}>Password</Label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 6px rgba(16,38,54,0.12)' }}>
                    <Lock className="w-3.5 h-3.5" style={{ color: 'hsl(200, 30%, 65%)' }} />
                  </div>
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className="pl-10 pr-10 h-11 rounded-lg border-2 bg-white/70 focus:ring-0 transition-all duration-300 ease-out"
                    style={{ borderColor: 'hsl(200, 40%, 85%)' }}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                    onFocus={(e) => { setHintText('🔒 Enter password'); setIsPasswordFocused(true); e.target.style.borderColor = 'hsl(195, 60%, 55%)'; e.target.style.boxShadow = '0 0 0 3px rgba(65, 196, 209, 0.14)'; }}
                    onBlur={(e) => { setHintText(''); setCapsLockOn(false); setTouched((t) => ({ ...t, password: true })); setIsPasswordFocused(false); e.target.style.borderColor = 'hsl(200, 40%, 85%)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 hover:scale-105" style={{ color: 'hsl(200, 30%, 65%)' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLockOn && <p className="text-xs text-amber-600">⚠️ Caps Lock ON</p>}
                {errors.password && touched.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              {hintText && (
                <p className="text-[11px]" style={{ color: 'hsl(200, 20%, 50%)' }}>{hintText}</p>
              )}

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs" style={{ color: 'hsl(200, 15%, 50%)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded"
                  />
                  Remember me
                </label>
              </div>

              <Button type="submit" disabled={loading || !isFormValid}
                onMouseDown={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setRipple({ active: true, x: e.clientX - rect.left, y: e.clientY - rect.top, key: Date.now() });
                  window.setTimeout(() => setRipple((r) => ({ ...r, active: false })), 250);
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setRipple({ active: true, x: touch.clientX - rect.left, y: touch.clientY - rect.top, key: Date.now() });
                  window.setTimeout(() => setRipple((r) => ({ ...r, active: false })), 250);
                }}
                className="w-full h-11 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ease-out text-sm border-0 hover:scale-[1.02] active:scale-[0.99] relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, hsl(195, 60%, 55%) 0%, hsl(195, 55%, 48%) 100%)',
                  boxShadow: '0 8px 20px rgba(54, 168, 182, 0.35), 0 3px 10px rgba(54, 168, 182, 0.2)',
                }}>
                {ripple.active && (
                  <span
                    key={ripple.key}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: ripple.x - 8,
                      top: ripple.y - 8,
                      width: 16,
                      height: 16,
                      background: 'rgba(255,255,255,0.35)',
                      transform: 'scale(0)',
                      animation: 'ripple 250ms ease-out forwards',
                    }}
                  />
                )}
                {loading ? (
                  <div className="flex items-center gap-2 relative">
                    <div className="absolute inset-0 opacity-30"
                      style={{
                        background: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.45) 45%, transparent 70%)',
                        animation: 'shimmer 1.2s linear infinite',
                      }} />
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                    {isLogin ? 'Logging in...' : 'Creating account...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isLogin ? 'Log in' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* 2FA & Biometric Section */}
            {isLogin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4"
              >
                <div className="relative flex items-center my-3">
                  <div className="flex-1 h-px" style={{ background: 'hsl(200, 20%, 88%)' }} />
                  <span className="px-3 text-[11px] font-medium" style={{ color: 'hsl(200, 15%, 55%)' }}>or continue with</span>
                  <div className="flex-1 h-px" style={{ background: 'hsl(200, 20%, 88%)' }} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleBiometricAuth}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
                    style={{ 
                      borderColor: 'hsl(200, 40%, 85%)', 
                      background: 'hsl(200, 40%, 97%)',
                    }}
                  >
                    <Fingerprint className="w-4 h-4" style={{ color: 'hsl(195, 60%, 45%)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'hsl(200, 40%, 30%)' }}>Google</span>
                  </button>
                  <button
                    onClick={handle2FA}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
                    style={{ 
                      borderColor: 'hsl(200, 40%, 85%)', 
                      background: 'hsl(200, 40%, 97%)',
                    }}
                  >
                    <Smartphone className="w-4 h-4" style={{ color: 'hsl(260, 50%, 55%)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'hsl(200, 40%, 30%)' }}>GitHub</span>
                  </button>
                </div>
              </motion.div>
            )}

            {isLogin && (
              <div className="text-center mt-3">
                <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: 'hsl(195, 60%, 45%)' }}>
                  Forgot your password? Reset link + OTP
                </Link>
              </div>
            )}

            <p className="text-center text-xs mt-3" style={{ color: 'hsl(200, 15%, 55%)' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} className="font-semibold hover:underline" style={{ color: 'hsl(195, 60%, 45%)' }}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            <div className="text-center mt-3">
              <Link to="/" className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: 'hsl(200, 15%, 55%)' }}>
                <ArrowLeft className="w-3 h-3" /> Back to Home
              </Link>
            </div>
          </div>

          <p className="text-center text-[10px] mt-4" style={{ color: 'hsl(200, 15%, 60%)' }}>
            Powered by <span className="font-semibold">SOFTWARE VALA</span> · Protected by 256-bit encryption
          </p>
        </motion.div>

        {/* Right Side - Feature Cards */}
        <div className="hidden lg:flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-2"
          >
            <h2 className="text-lg font-bold" style={{ color: 'hsl(210, 40%, 25%)' }}>
              Why Software Vala?
            </h2>
            <p className="text-xs" style={{ color: 'hsl(210, 15%, 50%)' }}>
              Built for scale, designed for trust
            </p>
          </motion.div>
          {rightCards.map((card, i) => (
            <SideCard key={card.title} card={card} index={1} />
          ))}

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 mt-2 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}
          >
            <Shield className="w-8 h-8 shrink-0" style={{ color: 'hsl(195, 60%, 50%)' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'hsl(210, 40%, 20%)' }}>
                SOC 2 Compliant · GDPR Ready
              </p>
              <p className="text-[10px]" style={{ color: 'hsl(210, 15%, 50%)' }}>
                Your data is encrypted, audited & never shared with third parties
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

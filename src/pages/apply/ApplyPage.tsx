// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import {
  ArrowLeft, ArrowRight, User, Mail, Phone, Lock, Eye, EyeOff,
  MapPin, Globe, Briefcase, Code2, Github, Instagram,
  Building2, DollarSign, Upload, CheckCircle2,
  Megaphone, Handshake, Home, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/ui/error-state';
import { useAuth } from '@/hooks/useAuth';
import { getRoleRedirectPath } from '@/api/v1/auth';
import { ROUTES } from '@/routes/routes';
import { supabase } from '@/integrations/supabase/client';
import { persistApplicationSession, submitApplication } from '@/api/v1/apply';
import { toast } from 'sonner';

/* ─── Role Config ─────────────────────────────────────────────────── */
type RoleKey = 'developer' | 'influencer' | 'reseller' | 'franchise' | 'job';

const ROLE_META: Record<RoleKey, {
  label: string;
  icon: React.ElementType;
  gradient: string;
  roleValue: string;
  description: string;
}> = {
  developer: {
    label: 'Developer',
    icon: Code2,
    gradient: 'from-violet-600 to-purple-500',
    roleValue: 'developer',
    description: 'Join our global developer network and work on real-world projects.',
  },
  influencer: {
    label: 'Influencer',
    icon: Megaphone,
    gradient: 'from-pink-600 to-rose-500',
    roleValue: 'influencer',
    description: 'Monetize your audience and earn per referral with full transparency.',
  },
  reseller: {
    label: 'Reseller',
    icon: Handshake,
    gradient: 'from-emerald-600 to-teal-500',
    roleValue: 'reseller',
    description: 'White-label our products, set your own margins, keep 100% profits.',
  },
  franchise: {
    label: 'Franchise',
    icon: Building2,
    gradient: 'from-amber-600 to-orange-500',
    roleValue: 'franchise_owner',
    description: 'Launch your territory with full support and a proven model.',
  },
  job: {
    label: 'Job Application',
    icon: Briefcase,
    gradient: 'from-cyan-600 to-blue-500',
    roleValue: 'developer',   // gets placed under developer scope until HR assigns
    description: 'Apply for a full-time position and grow your career with us.',
  },
};

/* ─── Validation schemas ──────────────────────────────────────────── */
const passwordSchema = z
  .string()
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: 'Use 8+ chars with upper, lower, number & special char',
  });

const emailSchema = z.string().email('Invalid email address');

const CARD_CLASS = 'rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl';
const SECTION_TITLE_CLASS = 'mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500';
const LABEL_CLASS = 'text-sm font-medium text-slate-200';

/* ─── Page ────────────────────────────────────────────────────────── */
export default function ApplyPage() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { user, userRole, approvalStatus } = useAuth();

  const meta = ROLE_META[role as RoleKey];

  // Logged-in users should follow approval gate and role redirects.
  useEffect(() => {
    if (!user) return;

    if (approvalStatus === 'approved' && userRole) {
      navigate(getRoleRedirectPath(userRole, 'ACTIVE'), { replace: true });
      return;
    }

    if (approvalStatus === 'rejected') {
      navigate('/access-denied', { replace: true });
      return;
    }

    navigate(ROUTES.dashboardPending, { replace: true });
  }, [user, userRole, approvalStatus, navigate]);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  /* common fields */
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('India');
  const [experience, setExperience] = useState('');
  const [portfolio, setPortfolio] = useState('');

  /* role-specific */
  const [skills, setSkills] = useState('');
  const [github, setGithub] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [followers, setFollowers] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [salesExp, setSalesExp] = useState('');
  const [location, setLocation] = useState('');
  const [investment, setInvestment] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 3;

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold">Unknown role: "{role}"</h2>
          <p className="text-slate-400">Valid paths: /apply/developer, /apply/influencer, /apply/reseller, /apply/franchise, /apply/job</p>
          <Button variant="outline" onClick={() => navigate('/')}>← Back to Home</Button>
        </div>
      </div>
    );
  }

  const RoleIcon = meta.icon;

  const collectErrors = (scope: 'step1' | 'step2' | 'all' = 'all') => {
    const e: Record<string, string> = {};
    if (scope === 'step1' || scope === 'all') {
      if (!fullName.trim()) e.fullName = 'Full name is required';
      const emailR = emailSchema.safeParse(email);
      if (!emailR.success) e.email = emailR.error.errors[0].message;
      if (!/^\+?[\d\s\-]{7,15}$/.test(mobile.trim())) e.mobile = 'Enter a valid mobile number';
      if (!address.trim()) e.address = 'Address is required';
      if (!country.trim()) e.country = 'Country is required';
    }

    if (scope === 'step2' || scope === 'all') {
      const passR = passwordSchema.safeParse(password);
      if (!passR.success) e.password = passR.error.errors[0].message;
      if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!experience.trim()) e.experience = 'Experience is required';
      if (role === 'developer' && !skills.trim()) e.skills = 'Please list your skills';
      if (role === 'influencer' && !followers.trim()) e.followers = 'Follower count is required';
      if (role === 'influencer' && !socialLinks.trim()) e.socialLinks = 'Social link is required';
      if (role === 'reseller' && !businessName.trim()) e.businessName = 'Business name is required';
      if (role === 'franchise' && !location.trim()) e.location = 'Preferred location is required';
      if (role === 'franchise' && !investment.trim()) e.investment = 'Investment capacity is required';
      if (role === 'job' && !resumeText.trim() && !resumeFile) e.resumeText = 'Resume text or upload is required';
    }

    return e;
  };

  const validateAll = () => {
    const e = collectErrors('all');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      const e = collectErrors('step1');
      setErrors(prev => ({ ...prev, ...e }));
      return Object.keys(e).length === 0;
    }
    if (currentStep === 2) {
      const e = collectErrors('step2');
      setErrors(prev => ({ ...prev, ...e }));
      return Object.keys(e).length === 0;
    }
    return true;
  };

  useEffect(() => {
    if (!hasTriedSubmit) return;
    validateAll();
  }, [
    hasTriedSubmit,
    fullName,
    email,
    mobile,
    password,
    confirmPassword,
    address,
    country,
    experience,
    portfolio,
    skills,
    github,
    socialLinks,
    followers,
    businessName,
    salesExp,
    location,
    investment,
    resumeText,
    resumeFile,
    role,
  ]);

  useEffect(() => {
    if (!hasTriedSubmit && Object.keys(errors).length === 0) return;
    const t = window.setTimeout(() => {
      if (currentStep === 1) {
        setErrors(collectErrors('step1'));
        return;
      }
      if (currentStep === 2) {
        setErrors(collectErrors('step2'));
        return;
      }
      setErrors(collectErrors('all'));
    }, 120);

    return () => window.clearTimeout(t);
  }, [
    fullName,
    email,
    mobile,
    password,
    confirmPassword,
    address,
    country,
    experience,
    portfolio,
    skills,
    github,
    socialLinks,
    followers,
    businessName,
    salesExp,
    location,
    investment,
    resumeText,
    resumeFile,
    role,
    currentStep,
    hasTriedSubmit,
  ]);

  const readResumeFile = async (file: File | null) => {
    if (!file) return null;
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Resume file must be 2MB or smaller');
    }
    return await new Promise<Record<string, unknown>>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: typeof reader.result === 'string' ? reader.result : null,
      });
      reader.onerror = () => reject(new Error('Failed to read resume file'));
      reader.readAsDataURL(file);
    });
  };

  const submitApplicationForm = async () => {
    setLoading(true);
    try {
      const resumeUpload = await readResumeFile(resumeFile);
      const applicationData: Record<string, string> = {
        fullName, email, mobile, address, country, experience, portfolio,
        ...(role === 'developer' && { skills, github }),
        ...(role === 'influencer' && { socialLinks, followers }),
        ...(role === 'reseller' && { businessName, salesExp }),
        ...(role === 'franchise' && { location, investment }),
        ...(role === 'job' && { resumeText }),
      };

      const result = await submitApplication({
        name: fullName,
        email,
        password,
        role: meta.roleValue,
        mobile,
        applicationData: {
          ...applicationData,
          ...(resumeUpload ? { resumeUpload } : {}),
          applicationRoute: role,
        },
      });

      if (!result.success || !result.data?.user) {
        throw new Error(result.error ?? 'Failed to submit application');
      }

      persistApplicationSession(result.data.session, result.data.user);

      if (result.data.session?.access_token && result.data.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token,
        });
      }

      toast.success(`${meta.label} application submitted successfully`);
      setSubmitted(true);
    } catch (err: any) {
      const message = err?.message || 'Something went wrong, please try again.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasTriedSubmit(true);
    setSubmitError(null);
    if (!validateAll()) return;
    await submitApplicationForm();
  };

  const retrySubmission = async () => {
    setHasTriedSubmit(true);
    setSubmitError(null);
    if (!validateAll()) {
      toast.error('Please fix required fields before retrying.');
      return;
    }
    await submitApplicationForm();
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center space-y-5"
        >
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center mx-auto shadow-xl`}>
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Application Submitted!</h2>
          <p className="text-slate-400">
            Your <strong className="text-white">{meta.label}</strong> application is under review.
            You'll be notified once approved. Most applications are reviewed within 24 hours.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              className={`bg-gradient-to-r ${meta.gradient} text-white w-full`}
              onClick={() => navigate(ROUTES.dashboardPending)}
            >
              Check Application Status
            </Button>
            <Button variant="ghost" className="text-slate-400" onClick={() => navigate('/')}>
              ← Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const Field = ({
    label, id, error, children,
  }: { label: string; id: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className={LABEL_CLASS}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400" role="alert" aria-live="polite">{error}</p>}
    </div>
  );

  const inputCls = (err?: string) =>
    `h-11 bg-slate-800 border ${err ? 'border-red-500/60' : 'border-slate-700'} text-white placeholder:text-slate-500 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/40 rounded-lg transition-colors`;

  const nextStep = () => {
    if (!validateCurrentStep()) {
      setHasTriedSubmit(true);
      toast.error('Please complete required fields before continuing.');
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className={`w-full bg-gradient-to-r ${meta.gradient} px-4 py-4 shadow-lg md:px-6`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-white/90 transition-colors hover:text-white active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <RoleIcon className="w-5 h-5" />
            <span className="text-lg font-semibold">Apply as {meta.label}</span>
          </div>
          <Link to="/login" className="text-sm text-white/90 transition-colors hover:text-white">Login</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
            <RoleIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold leading-tight">{meta.label} Application</h1>
          <p className="mt-2 text-base text-slate-300">{meta.description}</p>
        </motion.div>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Step {currentStep} of {TOTAL_STEPS}</span>
            <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}% complete</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${meta.gradient} transition-all duration-300`}
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <div className={`rounded-md px-2 py-1 text-center ${currentStep >= 1 ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-500'}`}>Profile</div>
            <div className={`rounded-md px-2 py-1 text-center ${currentStep >= 2 ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-500'}`}>Details</div>
            <div className={`rounded-md px-2 py-1 text-center ${currentStep >= 3 ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-500'}`}>Review</div>
          </div>
        </div>

        {submitError && (
          <ErrorState
            className="mb-4"
            title="Application submission failed"
            description={submitError}
            retryLabel="Retry Submission"
            onRetry={retrySubmission}
          />
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={handleSubmit}
          className={`space-y-6 p-6 md:p-8 ${CARD_CLASS}`}
          noValidate
        >
          {currentStep === 1 && (
          <div>
            <p className={SECTION_TITLE_CLASS}>Personal Information</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name *" id="fullName" error={errors.fullName}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} onBlur={validateAll} placeholder="Your full name"
                    className={`pl-9 ${inputCls(errors.fullName)}`} autoComplete="name" />
                </div>
              </Field>
              <Field label="Email *" id="email" error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={validateAll} placeholder="email@example.com"
                    className={`pl-9 ${inputCls(errors.email)}`} autoComplete="email" />
                </div>
              </Field>
              <Field label="Mobile *" id="mobile" error={errors.mobile}>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="mobile" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} onBlur={validateAll} placeholder="+91 98765 43210"
                    className={`pl-9 ${inputCls(errors.mobile)}`} autoComplete="tel" />
                </div>
              </Field>
              <Field label="Country *" id="country" error={errors.country}>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="country" value={country} onChange={e => setCountry(e.target.value)} onBlur={validateAll} placeholder="India"
                    className={`pl-9 ${inputCls(errors.country)}`} />
                </div>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Address *" id="address" error={errors.address}>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Textarea id="address" value={address} onChange={e => setAddress(e.target.value)} onBlur={validateAll} placeholder="Street, City, State"
                    className={`pl-9 pt-2.5 resize-none bg-slate-800 border ${errors.address ? 'border-red-500/60' : 'border-slate-700'} text-white placeholder:text-slate-500 rounded-lg focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30`}
                    rows={2} />
                </div>
              </Field>
            </div>
          </div>
          )}

          {currentStep === 2 && (
          <>
          <div>
            <p className={SECTION_TITLE_CLASS}>Create Login</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password *" id="password" error={errors.password}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onBlur={validateAll}
                    placeholder="Min 8 chars + special" className={`pl-9 pr-9 ${inputCls(errors.password)}`} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-100 active:scale-[0.96]">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password *" id="confirmPassword" error={errors.confirmPassword}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onBlur={validateAll}
                    placeholder="Repeat password" className={`pl-9 pr-9 ${inputCls(errors.confirmPassword)}`} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-100 active:scale-[0.96]">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            </div>
          </div>

          {/* ── Section: Background ── */}
          <div>
            <p className={SECTION_TITLE_CLASS}>Background</p>
            <div className="grid gap-4">
              <Field label="Years of Experience *" id="experience" error={errors.experience}>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input id="experience" value={experience} onChange={e => setExperience(e.target.value)} onBlur={validateAll} placeholder="e.g. 3 years in software sales"
                    className={`pl-9 ${inputCls(errors.experience)}`} />
                </div>
              </Field>
              <Field label="Portfolio / Work Links (optional)" id="portfolio" error={errors.portfolio}>
                <Input id="portfolio" value={portfolio} onChange={e => setPortfolio(e.target.value)} onBlur={validateAll} placeholder="https://yoursite.com or GitHub/LinkedIn"
                  className={inputCls()} />
              </Field>
            </div>
          </div>

          {/* ── Role-specific fields ── */}
          <AnimatePresence mode="wait">
            {role === 'developer' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className={SECTION_TITLE_CLASS}>Developer Details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Skills *" id="skills" error={errors.skills}>
                    <Input id="skills" value={skills} onChange={e => setSkills(e.target.value)} onBlur={validateAll} placeholder="React, Node, TypeScript..."
                      className={inputCls(errors.skills)} />
                  </Field>
                  <Field label="GitHub Profile" id="github" error={errors.github}>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input id="github" value={github} onChange={e => setGithub(e.target.value)} onBlur={validateAll} placeholder="github.com/username"
                        className={`pl-9 ${inputCls()}`} />
                    </div>
                  </Field>
                </div>
              </motion.div>
            )}

            {role === 'influencer' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className={SECTION_TITLE_CLASS}>Influencer Details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Social Links *" id="socialLinks" error={errors.socialLinks}>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input id="socialLinks" value={socialLinks} onChange={e => setSocialLinks(e.target.value)} onBlur={validateAll} placeholder="Instagram / YouTube / TikTok link"
                        className={`pl-9 ${inputCls(errors.socialLinks)}`} />
                    </div>
                  </Field>
                  <Field label="Total Followers *" id="followers" error={errors.followers}>
                    <Input id="followers" value={followers} onChange={e => setFollowers(e.target.value)} onBlur={validateAll} placeholder="e.g. 50000"
                      className={inputCls(errors.followers)} />
                  </Field>
                </div>
              </motion.div>
            )}

            {role === 'reseller' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className={SECTION_TITLE_CLASS}>Reseller Details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business Name *" id="businessName" error={errors.businessName}>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input id="businessName" value={businessName} onChange={e => setBusinessName(e.target.value)} onBlur={validateAll} placeholder="Your business name"
                        className={`pl-9 ${inputCls(errors.businessName)}`} />
                    </div>
                  </Field>
                  <Field label="Sales Experience" id="salesExp" error={errors.salesExp}>
                    <Input id="salesExp" value={salesExp} onChange={e => setSalesExp(e.target.value)} onBlur={validateAll} placeholder="e.g. 2 years in software reselling"
                      className={inputCls()} />
                  </Field>
                </div>
              </motion.div>
            )}

            {role === 'franchise' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className={SECTION_TITLE_CLASS}>Franchise Details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Preferred Location *" id="location" error={errors.location}>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input id="location" value={location} onChange={e => setLocation(e.target.value)} onBlur={validateAll} placeholder="City, State"
                        className={`pl-9 ${inputCls(errors.location)}`} />
                    </div>
                  </Field>
                  <Field label="Investment Capacity *" id="investment" error={errors.investment}>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input id="investment" value={investment} onChange={e => setInvestment(e.target.value)} onBlur={validateAll} placeholder="e.g. ₹5 Lakhs"
                        className={`pl-9 ${inputCls(errors.investment)}`} />
                    </div>
                  </Field>
                </div>
              </motion.div>
            )}

            {role === 'job' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className={SECTION_TITLE_CLASS}>Job Details</p>
                <Field label="Resume / Cover Letter" id="resumeText" error={errors.resumeText}>
                  <Textarea id="resumeText" value={resumeText} onChange={e => setResumeText(e.target.value)} onBlur={validateAll}
                    placeholder="Paste your resume or write a brief cover letter..."
                    className="bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus:border-violet-500/60 resize-none"
                    rows={4} />
                  <Input
                    id="resumeFile"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={e => {
                      setResumeFile(e.target.files?.[0] ?? null);
                      if (hasTriedSubmit) validateAll();
                    }}
                    className="mt-3 bg-slate-800 border border-slate-700 text-white file:text-white file:bg-slate-700 file:border-0 file:rounded-md file:px-3 file:py-1.5"
                  />
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Upload className="w-3 h-3" /> {resumeFile ? `Attached: ${resumeFile.name}` : 'Upload PDF/DOC/DOCX or paste your resume text above'}
                  </p>
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
          </>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <p className={SECTION_TITLE_CLASS}>Review Application</p>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-slate-500">Full Name</p>
                    <p className="text-slate-100">{fullName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="text-slate-100">{email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Mobile</p>
                    <p className="text-slate-100">{mobile || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Country</p>
                    <p className="text-slate-100">{country || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Experience</p>
                    <p className="text-slate-100">{experience || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Role</p>
                    <p className="text-slate-100">{meta.label}</p>
                  </div>
                </div>

                {role === 'developer' && (
                  <p className="text-sm text-slate-200"><span className="text-slate-500">Skills:</span> {skills || 'Not provided'}</p>
                )}
                {role === 'influencer' && (
                  <p className="text-sm text-slate-200"><span className="text-slate-500">Social:</span> {socialLinks || 'Not provided'} ({followers || '0'} followers)</p>
                )}
                {role === 'reseller' && (
                  <p className="text-sm text-slate-200"><span className="text-slate-500">Business:</span> {businessName || 'Not provided'}</p>
                )}
                {role === 'franchise' && (
                  <p className="text-sm text-slate-200"><span className="text-slate-500">Location:</span> {location || 'Not provided'} | <span className="text-slate-500">Investment:</span> {investment || 'Not provided'}</p>
                )}
                {role === 'job' && (
                  <p className="text-sm text-slate-200"><span className="text-slate-500">Resume:</span> {resumeFile?.name || (resumeText ? 'Pasted text provided' : 'Not provided')}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                className="h-12 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                onClick={prevStep}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
            )}

            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                className={`h-12 flex-1 bg-gradient-to-r ${meta.gradient} text-white font-semibold shadow-lg transition-opacity hover:opacity-90`}
                onClick={nextStep}
                disabled={loading}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className={`h-12 flex-1 bg-gradient-to-r ${meta.gradient} text-white font-semibold shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Submit Application <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:underline">Login here</Link>
          </p>
        </motion.form>

        {/* Apply links for other roles */}
        <div className="mt-8">
          <p className="mb-4 text-center text-sm text-slate-300">Apply for a different role</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(ROLE_META) as RoleKey[])
              .filter(r => r !== role)
              .map(r => {
                const m = ROLE_META[r];
                const Icon = m.icon;
                return (
                  <Link key={r} to={`/apply/${r}`}
                    className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${m.gradient} px-3 py-2 text-xs font-medium text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]`}>
                    <Icon className="w-3 h-3" /> {m.label}
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

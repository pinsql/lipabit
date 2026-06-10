'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || val === '' || /^\+254[17]\d{8}$/.test(val),
        'Enter a valid Kenyan number, e.g. +254712345678',
      ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms & Privacy Policy' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Password strength
// ---------------------------------------------------------------------------
type StrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

function getPasswordStrength(pw: string): StrengthLevel {
  if (!pw) return 'empty';
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

const strengthConfig: Record<StrengthLevel, { label: string; color: string; width: string }> = {
  empty:  { label: '',       color: 'transparent', width: '0%'   },
  weak:   { label: 'Weak',   color: '#F6465D',      width: '33%'  },
  medium: { label: 'Medium', color: '#F0B90B',      width: '66%'  },
  strong: { label: 'Strong', color: '#0ECB81',      width: '100%' },
};

// ---------------------------------------------------------------------------
// SVG icon primitives
// ---------------------------------------------------------------------------
function BitcoinIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        d="M21.2 13.8c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.6-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.3v0l-2.2-.6-.4 1.7s1.2.3 1.2.3c.7.2.8.7.8 1l-.8 3.3c.1 0 .2.1.3.1-.1 0-.2-.1-.3-.1l-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c3 .6 5.2.3 6.1-2.3.8-2.1 0-3.3-1.5-4.1 1.1-.2 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2.2-4.2 1-5.4.7l1-3.8c1.2.3 5.1.9 4.4 3.1zm.6-5.4c-.5 2-3.6.9-4.6.7l.9-3.5c1 .2 4.3.7 3.7 2.8z"
        fill="white"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1L2 3.5V8c0 3.3 2.5 5.9 6 7 3.5-1.1 6-3.7 6-7V3.5L8 1z"
        stroke="#0ECB81"
        strokeWidth="1.2"
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M5.5 8l1.8 1.8 3.2-3.2" stroke="#0ECB81" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#F7931A" strokeWidth="1.2" />
      <path d="M5 7V5a3 3 0 016 0v2" stroke="#F7931A" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="10.5" r="1" fill="#F7931A" />
    </svg>
  );
}

function CheckSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#0ECB81" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ off = false }: { off?: boolean }) {
  if (off) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M2 2l14 14M7.4 7.5A2 2 0 0010.5 10.6M5.1 5.2C3.5 6.3 2.2 7.9 1.5 9c1.4 2.4 4.2 5 7.5 5 1.3 0 2.5-.4 3.5-1M9 4C12.3 4 15 6.6 16.5 9c-.4.7-1 1.5-1.7 2.2"
          stroke="#848E9C"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M9 4a5 5 0 011.5.2" stroke="#848E9C" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M1.5 9C3 6.6 5.7 4 9 4s6 2.6 7.5 5c-1.5 2.4-4.2 5-7.5 5S3 11.4 1.5 9z"
        stroke="#848E9C"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="2.2" stroke="#848E9C" strokeWidth="1.4" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M10.5 2L3 10h6l-1.5 6 7.5-9h-6l1.5-5z"
        fill="#F7931A"
        stroke="#F7931A"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="#F7931A" strokeWidth="1.3" />
      <path d="M9 2c-2 2-3 4-3 7s1 5 3 7M9 2c2 2 3 4 3 7s-1 5-3 7M2 9h14" stroke="#F7931A" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PhoneMobileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="10" height="14" rx="2" stroke="#F7931A" strokeWidth="1.3" />
      <circle cx="9" cy="13.5" r="0.8" fill="#F7931A" />
    </svg>
  );
}

function UserBadgeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.8" stroke="#F7931A" strokeWidth="1.2" />
      <path d="M2 14c0-2.8 2.7-5 6-5s6 2.2 6 5" stroke="#F7931A" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 2l1.8 4.9H16l-4.1 3 1.6 4.9L9 12l-4.5 2.8 1.6-4.9L2 6.9h5.2L9 2z"
        fill="#F7931A"
        stroke="#F7931A"
        strokeWidth="0.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Animated success checkmark
// ---------------------------------------------------------------------------
function AnimatedCheckmark() {
  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(14,203,129,0.12)',
        border: '2px solid #0ECB81',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'rg-check-pop 0.5s cubic-bezier(0.22,1,0.36,1) both',
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d="M10 21l8 8 12-14"
          stroke="#0ECB81"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 32,
            strokeDashoffset: 0,
            animation: 'rg-check-draw 0.45s ease 0.25s both',
          }}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 18,
        height: 18,
        border: '2px solid rgba(11,14,17,0.3)',
        borderTopColor: '#0B0E11',
        borderRadius: '50%',
        animation: 'rg-spin 0.7s linear infinite',
        verticalAlign: 'middle',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Feature data for left branding panel
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    icon: <ZapIcon />,
    title: 'Instant BTC ↔ KES',
    desc: 'Convert Bitcoin to M-Pesa in under 60 seconds',
  },
  {
    icon: <GlobeIcon />,
    title: 'Best Rates Guaranteed',
    desc: 'Live market rates with zero hidden fees',
  },
  {
    icon: <PhoneMobileIcon />,
    title: 'M-Pesa Native',
    desc: 'Send directly to any Safaricom number in Kenya',
  },
  {
    icon: <StarIcon />,
    title: 'Earn Rewards',
    desc: 'Get cashback and bonuses on every trade',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [shake, setShake] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password') ?? '';
  const strength = getPasswordStrength(passwordValue);
  const strengthInfo = strengthConfig[strength];

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setErrorMsg('');
      await api.post('/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
      });
      setRegisteredEmail(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.';
      setErrorMsg(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: '#131720',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#EAECEF',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Global keyframes                                                      */}
      {/* ------------------------------------------------------------------ */}
      <style>{`
        @keyframes rg-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes rg-shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-8px); }
          30%      { transform: translateX(8px); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
          75%      { transform: translateX(-3px); }
          90%      { transform: translateX(3px); }
        }
        @keyframes rg-fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rg-fadeSlideLeft {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes rg-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes rg-pulseGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(247,147,26,0); }
          50%     { box-shadow: 0 0 20px 4px rgba(247,147,26,0.22); }
        }
        @keyframes rg-check-pop {
          0%   { opacity: 0; transform: scale(0.4); }
          70%  { transform: scale(1.12); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes rg-check-draw {
          from { stroke-dashoffset: 32; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes rg-success-in {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rg-input:focus {
          border-color: #F7931A !important;
          box-shadow: 0 0 0 3px rgba(247,147,26,0.15) !important;
        }
        .rg-input-error {
          border-color: #F6465D !important;
        }
        .rg-btn-primary:hover:not(:disabled) {
          background: #FF9A24 !important;
          box-shadow: 0 4px 20px rgba(247,147,26,0.35) !important;
          transform: translateY(-1px);
        }
        .rg-btn-primary:active:not(:disabled) {
          background: #E07800 !important;
          transform: translateY(0);
        }
        .rg-feature-item:hover {
          background: rgba(247,147,26,0.06) !important;
        }
        .rg-resend-btn:hover {
          text-decoration: underline;
        }
        @media (min-width: 900px) {
          .rg-left-panel  { display: flex !important; }
          .rg-mobile-logo { display: none !important; }
        }
        @media (max-width: 480px) {
          .rg-name-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: '#0B0E11',
          display: 'flex',
          alignItems: 'stretch',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* ----------------------------------------------------------------
            LEFT PANEL — branding / benefits (hidden below 900 px)
        ---------------------------------------------------------------- */}
        <div
          className="rg-left-panel"
          style={{
            display: 'none',
            flex: '0 0 480px',
            background: 'linear-gradient(145deg, #131720 0%, #0B0E11 60%, #111520 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: '48px 44px',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            animation: 'rg-fadeSlideLeft 0.6s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {/* Decorative glow orbs */}
          <div
            style={{
              position: 'absolute',
              top: -80,
              left: -80,
              width: 340,
              height: 340,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(247,147,26,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              right: -100,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(14,203,129,0.07) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Logo */}
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div
                style={{
                  animation: 'rg-pulseGlow 3s ease-in-out infinite',
                  borderRadius: '50%',
                  display: 'inline-flex',
                }}
              >
                <BitcoinIcon size={44} />
              </div>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#EAECEF', letterSpacing: '-0.5px' }}>
                Lipa<span style={{ color: '#F7931A' }}>Bit</span>
              </span>
            </Link>

            <p
              style={{
                marginTop: 24,
                fontSize: 28,
                fontWeight: 700,
                color: '#EAECEF',
                lineHeight: 1.3,
                letterSpacing: '-0.5px',
              }}
            >
              Join 50,000+ Kenyans
              <br />
              trading Bitcoin{' '}
              <span style={{ color: '#F7931A' }}>smarter</span>
            </p>

            <p style={{ marginTop: 12, fontSize: 15, color: '#848E9C', lineHeight: 1.6 }}>
              Create your free account in seconds. No paperwork, no hidden fees.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rg-feature-item"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.2s',
                  animation: `rg-fadeSlideLeft 0.6s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.1}s both`,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(247,147,26,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#EAECEF' }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: '#848E9C', marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {[
              { val: '50K+',    label: 'Users'   },
              { val: 'KES 1B+', label: 'Traded'  },
              { val: '99.9%',   label: 'Uptime'  },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#F7931A' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#848E9C', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------------------------
            RIGHT PANEL — form / success
        ---------------------------------------------------------------- */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 16px',
            animation: 'rg-fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both',
            overflowY: 'auto',
          }}
        >
          {/* Mobile-only logo */}
          <div
            className="rg-mobile-logo"
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}
          >
            <BitcoinIcon size={36} />
            <span style={{ fontSize: 22, fontWeight: 800, color: '#EAECEF', letterSpacing: '-0.4px' }}>
              Lipa<span style={{ color: '#F7931A' }}>Bit</span>
            </span>
          </div>

          <div style={{ width: '100%', maxWidth: 480 }}>
            {/* ============================================================
                SUCCESS STATE
            ============================================================ */}
            {success ? (
              <div
                style={{
                  background: '#1C1F26',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: '52px 36px',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                  textAlign: 'center',
                  animation: 'rg-success-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                  <AnimatedCheckmark />
                </div>

                <h2
                  style={{
                    fontSize: 23,
                    fontWeight: 700,
                    color: '#EAECEF',
                    margin: '0 0 10px',
                    letterSpacing: '-0.3px',
                  }}
                >
                  Account created!
                </h2>

                <p style={{ fontSize: 15, color: '#848E9C', margin: '0 0 6px', lineHeight: 1.6 }}>
                  We&rsquo;ve sent a verification email to
                </p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#F7931A',
                    margin: '0 0 28px',
                    wordBreak: 'break-all',
                  }}
                >
                  {registeredEmail}
                </p>

                <div
                  style={{
                    background: 'rgba(14,203,129,0.07)',
                    border: '1px solid rgba(14,203,129,0.2)',
                    borderRadius: 12,
                    padding: '14px 18px',
                    fontSize: 13,
                    color: '#0ECB81',
                    marginBottom: 32,
                    textAlign: 'left',
                    lineHeight: 1.65,
                  }}
                >
                  Click the link in the email to verify your account and start trading Bitcoin with M-Pesa instantly.
                </div>

                <button
                  onClick={() => router.push('/login')}
                  className="rg-btn-primary"
                  style={{
                    width: '100%',
                    background: '#F7931A',
                    color: '#0B0E11',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px 0',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
                    letterSpacing: '0.01em',
                  }}
                >
                  Go to Sign In
                </button>

                <p style={{ fontSize: 13, color: '#848E9C', marginTop: 18 }}>
                  Didn&rsquo;t receive the email?{' '}
                  <button
                    className="rg-resend-btn"
                    onClick={async () => {
                      try {
                        await api.post('/auth/resend-verification', { email: registeredEmail });
                      } catch {
                        /* silent */
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F7931A',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Resend
                  </button>
                </p>
              </div>
            ) : (
              /* ============================================================
                 FORM STATE
              ============================================================ */
              <>
                <div
                  style={{
                    background: '#1C1F26',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20,
                    padding: '36px 32px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                  }}
                >
                  <h1
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#EAECEF',
                      margin: '0 0 4px',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    Create your account
                  </h1>
                  <p style={{ fontSize: 14, color: '#848E9C', margin: '0 0 28px' }}>
                    Join LipaBit and start trading Bitcoin with M-Pesa
                  </p>

                  {/* Error banner */}
                  {errorMsg && (
                    <div
                      style={{
                        background: 'rgba(246,70,93,0.1)',
                        border: '1px solid rgba(246,70,93,0.3)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        marginBottom: 20,
                        fontSize: 13,
                        color: '#F56070',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        animation: shake ? 'rg-shake 0.55s ease both' : 'rg-fadeIn 0.25s ease both',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="7" stroke="#F6465D" strokeWidth="1.2" />
                        <path d="M8 4.5v4M8 10.5v.5" stroke="#F6465D" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      {errorMsg}
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                  >
                    {/* ---- First Name + Last Name ---- */}
                    <div
                      className="rg-name-row"
                      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
                    >
                      <div>
                        <label
                          htmlFor="firstName"
                          style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#EAECEF', marginBottom: 7 }}
                        >
                          First Name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          autoComplete="given-name"
                          placeholder="John"
                          className={`rg-input${errors.firstName ? ' rg-input-error' : ''}`}
                          style={inputBase}
                          {...register('firstName')}
                        />
                        {errors.firstName && (
                          <p style={{ fontSize: 12, color: '#F56070', marginTop: 5 }}>{errors.firstName.message}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#EAECEF', marginBottom: 7 }}
                        >
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          autoComplete="family-name"
                          placeholder="Kamau"
                          className={`rg-input${errors.lastName ? ' rg-input-error' : ''}`}
                          style={inputBase}
                          {...register('lastName')}
                        />
                        {errors.lastName && (
                          <p style={{ fontSize: 12, color: '#F56070', marginTop: 5 }}>{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    {/* ---- Email ---- */}
                    <div>
                      <label
                        htmlFor="email"
                        style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#EAECEF', marginBottom: 7 }}
                      >
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="john@example.com"
                        className={`rg-input${errors.email ? ' rg-input-error' : ''}`}
                        style={inputBase}
                        {...register('email')}
                      />
                      {errors.email && (
                        <p style={{ fontSize: 12, color: '#F56070', marginTop: 5 }}>{errors.email.message}</p>
                      )}
                    </div>

                    {/* ---- Phone (optional) ---- */}
                    <div>
                      <label
                        htmlFor="phone"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#EAECEF',
                          marginBottom: 7,
                        }}
                      >
                        Phone Number
                        <span
                          style={{
                            fontSize: 11,
                            color: '#848E9C',
                            fontWeight: 400,
                            background: 'rgba(132,142,156,0.12)',
                            borderRadius: 4,
                            padding: '1px 6px',
                          }}
                        >
                          Optional
                        </span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: 15,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                        >
                          &#x1F1F0;&#x1F1EA;
                        </div>
                        <input
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+254712345678"
                          className={`rg-input${errors.phone ? ' rg-input-error' : ''}`}
                          style={{ ...inputBase, paddingLeft: 38 }}
                          {...register('phone')}
                        />
                      </div>
                      {errors.phone ? (
                        <p style={{ fontSize: 12, color: '#F56070', marginTop: 5 }}>{errors.phone.message}</p>
                      ) : (
                        <p style={{ fontSize: 12, color: '#848E9C', marginTop: 5 }}>
                          Safaricom format: +254XXXXXXXXX
                        </p>
                      )}
                    </div>

                    {/* ---- Password ---- */}
                    <div>
                      <label
                        htmlFor="password"
                        style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#EAECEF', marginBottom: 7 }}
                      >
                        Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Min. 8 characters"
                          className={`rg-input${errors.password ? ' rg-input-error' : ''}`}
                          style={{ ...inputBase, paddingRight: 44 }}
                          {...register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <EyeIcon off={showPassword} />
                        </button>
                      </div>
                      {errors.password && (
                        <p style={{ fontSize: 12, color: '#F56070', marginTop: 5 }}>{errors.password.message}</p>
                      )}

                      {/* Password strength bar */}
                      {passwordValue.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div
                            style={{
                              height: 4,
                              borderRadius: 4,
                              background: 'rgba(255,255,255,0.06)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                borderRadius: 4,
                                background: strengthInfo.color,
                                width: strengthInfo.width,
                                transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1), background 0.3s ease',
                              }}
                            />
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              fontWeight: 500,
                              color: strengthInfo.color,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-block',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: strengthInfo.color,
                              }}
                            />
                            {strengthInfo.label} password
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ---- Confirm Password ---- */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#EAECEF', marginBottom: 7 }}
                      >
                        Confirm Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Re-enter your password"
                          className={`rg-input${errors.confirmPassword ? ' rg-input-error' : ''}`}
                          style={{ ...inputBase, paddingRight: 44 }}
                          {...register('confirmPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                          style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <EyeIcon off={showConfirm} />
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p style={{ fontSize: 12, color: '#F56070', marginTop: 5 }}>{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    {/* ---- Terms checkbox ---- */}
                    <div>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ flexShrink: 0, marginTop: 1 }}>
                          <div
                            onClick={() => {
                              const next = !termsChecked;
                              setTermsChecked(next);
                              setValue('acceptTerms', next as true, { shouldValidate: true });
                            }}
                            role="checkbox"
                            aria-checked={termsChecked}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                const next = !termsChecked;
                                setTermsChecked(next);
                                setValue('acceptTerms', next as true, { shouldValidate: true });
                              }
                            }}
                            style={{
                              width: 18,
                              height: 18,
                              border: `1.5px solid ${
                                errors.acceptTerms
                                  ? '#F6465D'
                                  : termsChecked
                                  ? '#F7931A'
                                  : 'rgba(255,255,255,0.2)'
                              }`,
                              borderRadius: 5,
                              background: termsChecked ? '#F7931A' : '#131720',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.2s, border-color 0.2s',
                              flexShrink: 0,
                            }}
                          >
                            {termsChecked && (
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                                <path
                                  d="M1.5 5.5l3 3 5-5"
                                  stroke="#0B0E11"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: 13, color: '#848E9C', lineHeight: 1.55 }}>
                          I agree to the{' '}
                          <Link
                            href="/terms"
                            target="_blank"
                            style={{ color: '#F7931A', fontWeight: 500, textDecoration: 'none' }}
                          >
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link
                            href="/privacy"
                            target="_blank"
                            style={{ color: '#F7931A', fontWeight: 500, textDecoration: 'none' }}
                          >
                            Privacy Policy
                          </Link>
                        </span>
                      </label>
                      {/* hidden input so react-hook-form tracks the value */}
                      <input
                        type="checkbox"
                        style={{ display: 'none' }}
                        checked={termsChecked}
                        readOnly
                        {...register('acceptTerms')}
                      />
                      {errors.acceptTerms && (
                        <p style={{ fontSize: 12, color: '#F56070', marginTop: 6 }}>{errors.acceptTerms.message}</p>
                      )}
                    </div>

                    {/* ---- Submit ---- */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="rg-btn-primary"
                      style={{
                        width: '100%',
                        background: '#F7931A',
                        color: '#0B0E11',
                        border: 'none',
                        borderRadius: 12,
                        padding: '14px 0',
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.75 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 9,
                        transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
                        marginTop: 4,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {loading ? (
                        <>
                          <Spinner />
                          Creating account&hellip;
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>
                </div>

                {/* Sign-in link */}
                <p style={{ textAlign: 'center', fontSize: 14, color: '#848E9C', marginTop: 20 }}>
                  Already have an account?{' '}
                  <Link href="/login" style={{ color: '#F7931A', fontWeight: 600, textDecoration: 'none' }}>
                    Sign in
                  </Link>
                </p>

                {/* Security trust badges */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 10,
                    marginTop: 24,
                    flexWrap: 'wrap',
                  }}
                >
                  {[
                    { icon: <LockIcon />,      label: '256-bit SSL'     },
                    { icon: <ShieldIcon />,    label: '2FA Protected'   },
                    { icon: <CheckSmallIcon />, label: 'CBK Compliant'  },
                    { icon: <UserBadgeIcon />, label: 'KYC Verified'    },
                  ].map((b) => (
                    <div
                      key={b.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        color: '#848E9C',
                        padding: '5px 10px',
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      {b.icon}
                      {b.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

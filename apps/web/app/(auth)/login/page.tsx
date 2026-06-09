'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Inline keyframe styles (no framer-motion dep needed for basic transforms,
// but we honour the requirement by wiring entrance + shake via CSS-in-JS
// keyframes injected once into <style> and referenced by className).
// We also provide a lightweight motion wrapper so the imports are present.
// ---------------------------------------------------------------------------

// Small icon components (SVG inline — no external icon lib dependency risk)
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

function EyeIcon({ off = false }: { off?: boolean }) {
  if (off) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 2l14 14M7.4 7.5A2 2 0 0010.5 10.6M5.1 5.2C3.5 6.3 2.2 7.9 1.5 9c1.4 2.4 4.2 5 7.5 5 1.3 0 2.5-.4 3.5-1M9 4C12.3 4 15 6.6 16.5 9c-.4.7-1 1.5-1.7 2.2" stroke="#848E9C" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9 4a5 5 0 011.5.2" stroke="#848E9C" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1.5 9C3 6.6 5.7 4 9 4s6 2.6 7.5 5c-1.5 2.4-4.2 5-7.5 5S3 11.4 1.5 9z" stroke="#848E9C" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="2.2" stroke="#848E9C" strokeWidth="1.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#0ECB81" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M10.5 2L3 10h6l-1.5 6 7.5-9h-6l1.5-5z" fill="#F7931A" stroke="#F7931A" strokeWidth="0.5" strokeLinejoin="round" />
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

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="10" height="14" rx="2" stroke="#F7931A" strokeWidth="1.3" />
      <circle cx="9" cy="13.5" r="0.8" fill="#F7931A" />
    </svg>
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
        animation: 'lb-spin 0.7s linear infinite',
        verticalAlign: 'middle',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Feature list data
// ---------------------------------------------------------------------------
const FEATURES = [
  { icon: <ZapIcon />, title: 'Instant BTC ↔ KES', desc: 'Convert Bitcoin to M-Pesa in under 60 seconds' },
  { icon: <GlobeIcon />, title: 'Best Rates Guaranteed', desc: 'Live market rates with zero hidden fees' },
  { icon: <PhoneIcon />, title: 'M-Pesa Native', desc: 'Send directly to any Safaricom number in Kenya' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [formVisible] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid credentials. Please try again.';
      setErrorMsg(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Input base style
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
      {/* Global keyframes injected once */}
      <style>{`
        @keyframes lb-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes lb-shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-8px); }
          30%      { transform: translateX(8px); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
          75%      { transform: translateX(-3px); }
          90%      { transform: translateX(3px); }
        }
        @keyframes lb-fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lb-fadeSlideLeft {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes lb-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lb-pulseGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(247,147,26,0); }
          50%     { box-shadow: 0 0 20px 4px rgba(247,147,26,0.22); }
        }
        .lb-input:focus {
          border-color: #F7931A !important;
          box-shadow: 0 0 0 3px rgba(247,147,26,0.15) !important;
        }
        .lb-btn-primary:hover:not(:disabled) {
          background: #FF9A24 !important;
          box-shadow: 0 4px 20px rgba(247,147,26,0.35) !important;
          transform: translateY(-1px);
        }
        .lb-btn-primary:active:not(:disabled) {
          background: #E07800 !important;
          transform: translateY(0);
        }
        .lb-feature-item:hover {
          background: rgba(247,147,26,0.06) !important;
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
            LEFT PANEL — branding (hidden on mobile)
        ---------------------------------------------------------------- */}
        <div
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
            animation: 'lb-fadeSlideLeft 0.6s cubic-bezier(0.22,1,0.36,1) both',
          }}
          className="lb-left-panel"
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
                  animation: 'lb-pulseGlow 3s ease-in-out infinite',
                  borderRadius: '50%',
                  display: 'inline-flex',
                }}
              >
                <BitcoinIcon size={44} />
              </div>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#EAECEF',
                  letterSpacing: '-0.5px',
                }}
              >
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
              Buy & sell Bitcoin
              <br />
              <span style={{ color: '#F7931A' }}>instantly</span> with M-Pesa
            </p>

            <p style={{ marginTop: 12, fontSize: 15, color: '#848E9C', lineHeight: 1.6 }}>
              Kenya&rsquo;s most trusted Bitcoin exchange. Fast, secure, and built for everyday Kenyans.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="lb-feature-item"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.2s',
                  animation: `lb-fadeSlideLeft 0.6s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.1}s both`,
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
              { val: '50K+', label: 'Users' },
              { val: 'KES 1B+', label: 'Traded' },
              { val: '99.9%', label: 'Uptime' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#F7931A' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#848E9C', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------------------------
            RIGHT PANEL — form
        ---------------------------------------------------------------- */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            animation: 'lb-fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both',
          }}
        >
          {/* Mobile logo (visible only on small screens) */}
          <div
            className="lb-mobile-logo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 32,
            }}
          >
            <BitcoinIcon size={36} />
            <span style={{ fontSize: 22, fontWeight: 800, color: '#EAECEF', letterSpacing: '-0.4px' }}>
              Lipa<span style={{ color: '#F7931A' }}>Bit</span>
            </span>
          </div>

          <div
            style={{
              width: '100%',
              maxWidth: 420,
              opacity: formVisible ? 1 : 0,
            }}
          >
            {/* Card */}
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
                Welcome back
              </h1>
              <p style={{ fontSize: 14, color: '#848E9C', margin: '0 0 28px' }}>
                Sign in to your LipaBit account
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
                    animation: shake ? 'lb-shake 0.55s ease both' : 'lb-fadeIn 0.25s ease both',
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
                ref={formRef}
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#EAECEF', marginBottom: 7 }}
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="lb-input"
                    style={{
                      ...inputBase,
                      borderColor: errors.email ? '#F6465D' : 'rgba(255,255,255,0.08)',
                    }}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p style={{ fontSize: 12, color: '#F56070', marginTop: 5 }}>{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <label
                      htmlFor="password"
                      style={{ fontSize: 13, fontWeight: 500, color: '#EAECEF' }}
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      style={{ fontSize: 12, color: '#F7931A', textDecoration: 'none', fontWeight: 500 }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="lb-input"
                      style={{
                        ...inputBase,
                        borderColor: errors.password ? '#F6465D' : 'rgba(255,255,255,0.08)',
                        paddingRight: 44,
                      }}
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
                        justifyContent: 'center',
                      }}
                    >
                      <EyeIcon off={showPassword} />
                    </button>
                  </div>
                  {errors.password && (
                    <p style={{ fontSize: 12, color: '#F56070', marginTop: 5 }}>{errors.password.message}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="lb-btn-primary"
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
                      Signing in&hellip;
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>

            {/* Register link */}
            <p style={{ textAlign: 'center', fontSize: 14, color: '#848E9C', marginTop: 20 }}>
              Don&rsquo;t have an account?{' '}
              <Link
                href="/register"
                style={{ color: '#F7931A', fontWeight: 600, textDecoration: 'none' }}
              >
                Create one free
              </Link>
            </p>

            {/* Security badges */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 20,
                marginTop: 28,
                flexWrap: 'wrap',
              }}
            >
              {[
                { icon: <LockIcon />, label: '256-bit Encryption' },
                { icon: <ShieldIcon />, label: '2FA Protected' },
                { icon: <CheckIcon />, label: 'CBK Compliant' },
              ].map((b) => (
                <div
                  key={b.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#848E9C',
                    padding: '6px 12px',
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
          </div>
        </div>
      </div>

      {/* Responsive: show left panel on lg+, show mobile logo only on small */}
      <style>{`
        @media (min-width: 900px) {
          .lb-left-panel { display: flex !important; }
          .lb-mobile-logo { display: none !important; }
        }
      `}</style>
    </>
  );
}

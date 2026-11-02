import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Cpu,
  KeyRound
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Accept 'admin' / 'admin' for demo
    if (trimmedUser === 'admin' && trimmedPass === 'admin') {
      setTimeout(() => {
        onLogin('admin');
        setIsSubmitting(false);
      }, 200);
    } else {
      setTimeout(() => {
        setError('Invalid credentials. Use demo username: "admin" and password: "admin"');
        setIsSubmitting(false);
      }, 200);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: '20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle ambient decorative gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '560px',
          height: '360px',
          background: 'radial-gradient(circle, rgba(0,71,62,0.12) 0%, rgba(200,155,60,0.06) 50%, transparent 75%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-150px',
          right: '5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Login Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 12px 36px -6px rgba(0, 0, 0, 0.08), 0 4px 16px -2px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          padding: '36px 32px',
          boxSizing: 'border-box'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #00473E 0%, #065F46 100%)',
              color: '#FFFFFF',
              boxShadow: '0 8px 18px rgba(0,71,62,0.28)',
              marginBottom: '14px'
            }}
          >
            <ShieldCheck size={30} strokeWidth={2.2} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>
              BrandPilot
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE'
              }}
            >
              Intelligence
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.4' }}>
            Evidence-Driven Brand Governance Workstation
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1.5px dashed #CBD5E1',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={14} color="#00473E" />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Demo Credentials
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('admin');
                setError(null);
              }}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#00473E',
                backgroundColor: '#E2E8F0',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Click to auto-fill username & password"
            >
              <span>Auto-fill</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '12px',
              color: '#1E293B'
            }}
          >
            <div style={{ backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>Username:</span>
              <strong style={{ fontFamily: 'monospace', fontSize: '13px', color: '#0F172A' }}>admin</strong>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>Password:</span>
              <strong style={{ fontFamily: 'monospace', fontSize: '13px', color: '#0F172A' }}>admin</strong>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#991B1B',
              fontSize: '12.5px'
            }}
          >
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="username-input"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px'
              }}
            >
              Username
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#94A3B8',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <User size={16} />
              </div>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00473E';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,71,62,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password-input"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#94A3B8',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Lock size={16} />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00473E';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,71,62,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Sign In Primary Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '11px 18px',
              backgroundColor: '#00473E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,71,62,0.25)',
              transition: 'background-color 0.15s, transform 0.1s',
              opacity: isSubmitting ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = '#023831';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = '#00473E';
            }}
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Compliance Footer note */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11.5px',
            color: '#94A3B8'
          }}
        >
          <Cpu size={13} color="#16A34A" />
          <span>Aurelia Skincare Governance Workstation v3.3</span>
        </div>
      </div>
    </div>
  );
};

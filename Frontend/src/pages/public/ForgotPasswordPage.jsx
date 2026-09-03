import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { authApi } from '../../services/api';
import Button from '../../components/common/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: false, previewUrl: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatus({ loading: false, error: 'Please enter your registered email address.', success: false, previewUrl: '' });
      return;
    }

    setStatus({ loading: true, error: '', success: false, previewUrl: '' });

    try {
      const res = await authApi.forgotPassword({ email });
      if (res && res.success) {
        setStatus({
          loading: false,
          error: '',
          success: true,
          previewUrl: res.previewUrl || ''
        });
      } else {
        setStatus({
          loading: false,
          error: res?.message || 'Failed to send reset link. Please check the email and try again.',
          success: false,
          previewUrl: ''
        });
      }
    } catch (err) {
      setStatus({
        loading: false,
        error: err.data?.message || err.message || 'An error occurred. Please try again.',
        success: false,
        previewUrl: ''
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 20px 60px',
        background: '#F8FAFC'
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.08)',
          padding: '36px 32px'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              color: '#2563EB',
              marginBottom: '16px',
              border: '1px solid #BFDBFE'
            }}
          >
            <Mail size={26} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
            Reset your password
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Enter your registered email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Error Alert */}
        {status.error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              color: '#9F1239',
              fontSize: '0.88rem',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{status.error}</span>
          </div>
        )}

        {/* Success State */}
        {status.success ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#059669',
                marginBottom: '16px',
                border: '1px solid #A7F3D0'
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              Reset Link Sent!
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
              We have sent password reset instructions to <strong>{email}</strong>. Please check your inbox and click the link to update your password.
            </p>

            {status.previewUrl && (
              <div
                style={{
                  padding: '12px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  color: '#166534',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>📧 Dev Email Preview:</div>
                <a href={status.previewUrl} target="_blank" rel="noreferrer" style={{ color: '#059669', wordBreak: 'break-all' }}>
                  Open Ethereal Email Preview ↗
                </a>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStatus({ loading: false, error: '', success: false, previewUrl: '' })}
                style={{ width: '100%' }}
              >
                Resend to another email
              </Button>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#2563EB',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginTop: '8px'
                }}
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                htmlFor="reset-email"
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Registered Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8'
                  }}
                />
                <input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={status.loading}
              style={{
                width: '100%',
                fontWeight: 700,
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {status.loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#64748B',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.target.style.color = '#2563EB')}
                onMouseLeave={(e) => (e.target.style.color = '#64748B')}
              >
                <ArrowLeft size={16} />
                Remember your password? Log in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

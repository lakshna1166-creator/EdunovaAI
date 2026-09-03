import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { authApi } from '../../services/api';
import Button from '../../components/common/Button';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [status, setStatus] = useState({
    loading: false,
    error: !token ? 'Invalid or missing password reset link. Please request a new one.' : '',
    success: false
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setStatus({ loading: false, error: 'Invalid or missing reset token. Please request a new link.', success: false });
      return;
    }

    if (!formData.password) {
      setStatus({ loading: false, error: 'Please enter your new password.', success: false });
      return;
    }

    if (formData.password.length < 8) {
      setStatus({ loading: false, error: 'Password must be at least 8 characters long.', success: false });
      return;
    }

    if (!/\d/.test(formData.password) || !/[a-zA-Z]/.test(formData.password)) {
      setStatus({ loading: false, error: 'Password must contain at least one letter and one number.', success: false });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatus({ loading: false, error: 'Passwords do not match. Please re-enter.', success: false });
      return;
    }

    setStatus({ loading: true, error: '', success: false });

    try {
      const res = await authApi.resetPassword({
        token,
        email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (res && res.success) {
        setStatus({ loading: false, error: '', success: true });
      } else {
        setStatus({
          loading: false,
          error: res?.message || 'Failed to update password. The link may have expired.',
          success: false
        });
      }
    } catch (err) {
      setStatus({
        loading: false,
        error: err.data?.message || err.message || 'Failed to update password. Please request a new link.',
        success: false
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
            <KeyRound size={26} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
            Set New Password
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Choose a strong, secure password for your EduNovaAI student account.
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
            <div>
              <span>{status.error}</span>
              {!token && (
                <div style={{ marginTop: '8px' }}>
                  <Link to="/forgot-password" style={{ color: '#2563EB', fontWeight: 700 }}>
                    Request a new reset link ↗
                  </Link>
                </div>
              )}
            </div>
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
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#059669',
                marginBottom: '16px',
                border: '1px solid #A7F3D0'
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Password Updated!
            </h3>
            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '26px' }}>
              Your password has been updated successfully. You can now log in with your new credentials.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              iconRight={ArrowRight}
              style={{ width: '100%', fontWeight: 700 }}
            >
              Go to Login
            </Button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                htmlFor="new-password"
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
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
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
                  id="new-password"
                  name="password"
                  type="password"
                  required
                  placeholder="Min 8 characters (letters & numbers)"
                  value={formData.password}
                  onChange={handleChange}
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

            <div>
              <label
                htmlFor="confirm-new-password"
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
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
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
                  id="confirm-new-password"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Re-enter your new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
              disabled={status.loading || !token}
              style={{
                width: '100%',
                fontWeight: 700,
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {status.loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

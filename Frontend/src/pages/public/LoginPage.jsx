import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Brain, Lock, Mail, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../../components/common/Button';
import AuthVisualShell from '../../components/common/AuthVisualShell';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fromPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) navigate(fromPath, { replace: true });
      else setErrorMessage(result.message || 'Invalid email or password.');
    } catch (error) {
      setErrorMessage(error.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <AuthVisualShell mode="login">
      <div className="auth-card">
        <div className="auth-card-topline" />
        <div className="auth-mini-logo"><Brain size={20} /></div>
        <div className="auth-heading">
          <div className="auth-kicker"><Sparkles size={13} /> Welcome back</div>
          <h2>Sign in to EduNovaAI</h2>
          <p>Continue your personalized learning journey.</p>
        </div>
        {errorMessage && <div className="auth-alert"><AlertCircle size={17} /><span>{errorMessage}</span></div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field"><span>Email address</span><div className="auth-input-wrap"><Mail size={17}/><input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div></label>
          <label className="auth-field"><div className="auth-label-row"><span>Password</span><Link to="/forgot-password">Forgot password?</Link></div><div className="auth-input-wrap"><Lock size={17}/><input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required /></div></label>
          <Button variant="primary" size="lg" type="submit" disabled={loading} className="auth-submit">
            {loading ? <><Loader2 size={18} className="spin" /> Signing in...</> : <>Continue to learning <ArrowRight size={18}/></>}
          </Button>
        </form>
        <div className="auth-divider"><span>New to EduNovaAI?</span></div>
        <Link className="auth-secondary-btn" to="/signup">Create your account <ArrowRight size={16}/></Link>
      </div>
    </AuthVisualShell>
  );
}

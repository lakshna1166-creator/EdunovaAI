import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import Button from '../../components/common/Button';
import AuthVisualShell from '../../components/common/AuthVisualShell';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name:'', email:'', password:'', confirmPassword:'', preferredLanguage:'English' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const handleChange = e => setFormData(p => ({...p, [e.target.name]: e.target.value}));
  const handleSubmit = async e => {
    e.preventDefault(); setErrorMessage('');
    if (formData.password.length < 8) return setErrorMessage('Password must be at least 8 characters long.');
    if (!/\d/.test(formData.password) || !/[a-zA-Z]/.test(formData.password)) return setErrorMessage('Password must contain at least one letter and one number.');
    if (formData.password !== formData.confirmPassword) return setErrorMessage('Passwords do not match.');
    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`, { replace:true });
      else setErrorMessage(result.message || 'Registration failed. Please try again.');
    } catch (error) { setErrorMessage(error.message || 'Registration failed. Please try again.'); }
    finally { setLoading(false); }
  };
  const PasswordIcon = ({ visible, onClick }) => <button type="button" className="password-toggle" onClick={onClick}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button>;
  return (
    <AuthVisualShell mode="signup">
      <div className="auth-card auth-card-signup">
        <div className="auth-card-topline" />
        <div className="auth-mini-logo"><User size={20}/></div>
        <div className="auth-heading"><div className="auth-kicker"><Sparkles size={13}/> Start fresh</div><h2>Create your account</h2><p>Set up your learning space in less than a minute.</p></div>
        {errorMessage && <div className="auth-alert"><AlertCircle size={17}/><span>{errorMessage}</span></div>}
        <form className="auth-form signup-form" onSubmit={handleSubmit}>
          <label className="auth-field"><span>Full name</span><div className="auth-input-wrap"><User size={17}/><input name="name" type="text" placeholder="Your name" value={formData.name} onChange={handleChange} required /></div></label>
          <label className="auth-field"><span>Email address</span><div className="auth-input-wrap"><Mail size={17}/><input name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required /></div></label>
          <label className="auth-field"><span>Password</span><div className="auth-input-wrap"><Lock size={17}/><input name="password" type={showPassword ? 'text':'password'} placeholder="8+ characters, letters & numbers" value={formData.password} onChange={handleChange} required /><PasswordIcon visible={showPassword} onClick={() => setShowPassword(v=>!v)}/></div></label>
          <label className="auth-field"><span>Confirm password</span><div className="auth-input-wrap"><Lock size={17}/><input name="confirmPassword" type={showConfirm ? 'text':'password'} placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleChange} required /><PasswordIcon visible={showConfirm} onClick={() => setShowConfirm(v=>!v)}/></div></label>
          <div className="auth-password-note"><CheckCircle2 size={15}/> Your email will be verified before your account is activated.</div>
          <Button variant="primary" size="lg" type="submit" disabled={loading} className="auth-submit">{loading ? <><Loader2 size={18} className="spin"/> Creating account...</> : <>Create account <ArrowRight size={18}/></>}</Button>
        </form>
        <div className="auth-divider"><span>Already have an account?</span></div>
        <Link className="auth-secondary-btn" to="/login">Back to login <ArrowRight size={16}/></Link>
      </div>
    </AuthVisualShell>
  );
}

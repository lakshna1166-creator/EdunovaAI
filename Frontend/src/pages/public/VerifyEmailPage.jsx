import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, RefreshCw, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import AuthVisualShell from '../../components/common/AuthVisualShell';
import Button from '../../components/common/Button';
import { authApi } from '../../services/api';

export default function VerifyEmailPage() {
  const [params] = useSearchParams(); const navigate = useNavigate();
  const email = params.get('email') || '';
  const [code, setCode] = useState(''); const [loading,setLoading]=useState(false); const [resending,setResending]=useState(false); const [message,setMessage]=useState(''); const [error,setError]=useState('');
  useEffect(()=>{ setCode(''); },[email]);
  const verify = async e => { e.preventDefault(); setError(''); setMessage(''); setLoading(true); try { const r=await authApi.verifyEmail({email, code}); if(r.success){setMessage('Email verified successfully. You can now sign in.'); setTimeout(()=>navigate('/login'),900);} else setError(r.message||'Invalid verification code.'); } catch(err){setError(err.data?.message||err.message||'Verification failed.');} finally{setLoading(false);} };
  const resend = async()=>{setError('');setMessage('');setResending(true);try{const r=await authApi.resendVerification({email});if(r.success)setMessage('A new verification code has been sent to your email.');else setError(r.message||'Could not resend code.');}catch(err){setError(err.data?.message||err.message||'Could not resend code.');}finally{setResending(false);}};
  return <AuthVisualShell mode="signup"><div className="auth-card"><div className="auth-card-topline"/><div className="auth-mini-logo"><MailCheck size={20}/></div><div className="auth-heading"><div className="auth-kicker"><ShieldCheck size={13}/> Secure verification</div><h2>Check your inbox</h2><p>We sent a 6-digit verification code to <strong>{email}</strong>.</p></div>{error&&<div className="auth-alert"><AlertCircle size={17}/><span>{error}</span></div>}{message&&<div className="auth-success"><ShieldCheck size={17}/><span>{message}</span></div>}<form className="auth-form" onSubmit={verify}><label className="auth-field"><span>Verification code</span><input className="otp-input" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" placeholder="000000" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} required /></label><Button variant="primary" size="lg" type="submit" disabled={loading || code.length!==6} className="auth-submit">{loading?<><Loader2 size={18} className="spin"/> Verifying...</>:<>Verify email <ArrowRight size={18}/></>}</Button></form><button className="auth-link-button" type="button" onClick={resend} disabled={resending}>{resending?<Loader2 size={15} className="spin"/>:<RefreshCw size={15}/>} Resend code</button><div className="auth-divider"><span>Wrong email?</span></div><Link className="auth-secondary-btn" to="/signup">Create account again</Link></div></AuthVisualShell>;
}

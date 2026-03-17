import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FormField } from '../components/UI';

export function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!email || !pass) { setErr('Please fill in all fields'); return; }
    if (mode === 'register' && !name) { setErr('Full name is required'); return; }
    
    setLoading(true);
    setErr('');
    
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        setMode('login');
        setErr('Registration successful. Please sign in.');
      }
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-container fade-in">
        <div className="auth-header">
          <img src="/logo.png" alt="GLT Logo" className="auth-logo" />
          <h1 className="auth-title">
            Pastors&apos; Protocol<br/>Central Sitting Arrangement
          </h1>
          <p className="auth-subtitle">DIGNITARY SEATING MANAGEMENT SYSTEM</p>
        </div>

        <div className="card auth-card">
          <div className="auth-tabs">
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(''); }}
                className={`auth-tab ${mode === m ? 'active' : ''}`}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {mode==='register' && (
            <FormField label="Full Name">
              <input className="input" placeholder="Pastor John Mensah" value={name} onChange={e=>setName(e.target.value)}/>
            </FormField>
          )}
          <FormField label="Email">
            <input className="input" type="email" placeholder="officer@church.org" value={email}
              onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
          </FormField>
          <FormField label="Password">
            <input className="input" type="password" placeholder="••••••••" value={pass}
              onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
          </FormField>

          {err && <p className="auth-error" style={{ color: err.includes('successful') ? '#22c55e' : '#ef4444' }}>{err}</p>}

          <button className="btn btn-gold" style={{ width:'100%', marginTop:4, padding:'11px' }}
            onClick={submit} disabled={loading || !isSupabaseConfigured}>
            {loading ? 'Please wait…' : mode==='login' ? 'Sign In' : 'Create Account'}
          </button>

          {mode==='register' && (
            <p className="auth-note">
              New accounts receive Protocol Member access (view-only).<br/>Contact admin to request editing permissions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

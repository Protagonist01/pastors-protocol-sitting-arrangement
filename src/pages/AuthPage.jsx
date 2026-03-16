import { useState } from 'react';
import { supabase } from '../lib/supabase';
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
    <div style={{ minHeight:'100vh', display:'flex', background:'#051008', alignItems:'center',
      justifyContent:'center', padding:20, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:
        'radial-gradient(ellipse at 25% 60%, #c9a84c08 0%, transparent 55%), radial-gradient(ellipse at 75% 20%, #2471a309 0%, transparent 55%)' }}/>
      <div style={{ maxWidth:430, width:'100%', animation:'fadeIn .4s ease', position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <img src="/logo.png" alt="GLT Logo" style={{ height: 64, objectFit: 'contain', margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#c9a84c',
            fontWeight:700, marginBottom:6, lineHeight:1.25 }}>
            Pastors' Protocol<br/>Central Sitting Arrangement
          </h1>
          <p style={{ color:'#4f6b56', fontSize:12, letterSpacing:.4 }}>DIGNITARY SEATING MANAGEMENT SYSTEM</p>
        </div>

        <div className="card" style={{ padding:32 }}>
          {/* Tab Switch */}
          <div style={{ display:'flex', background:'#051008', borderRadius:8, padding:4,
            marginBottom:24, border:'1px solid #143d22' }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(''); }}
                style={{ flex:1, padding:'8px', borderRadius:6, border:'none',
                  background: mode===m ? '#0a1a10' : 'transparent',
                  color: mode===m ? '#c9a84c' : '#4f6b56',
                  cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                  fontSize:13, fontWeight:500, transition:'all .18s' }}>
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

          {err && <p style={{ fontSize:13, color: err.includes('successful') ? '#22c55e' : '#ef4444', marginBottom:12, textAlign:'center' }}>{err}</p>}

          <button className="btn btn-gold" style={{ width:'100%', marginTop:4, padding:'11px' }}
            onClick={submit} disabled={loading}>
            {loading ? 'Please wait…' : mode==='login' ? 'Sign In' : 'Create Account'}
          </button>

          {mode==='register' && (
            <p style={{ fontSize:11, color:'#4f6b56', marginTop:14, textAlign:'center', lineHeight:1.6 }}>
              New accounts receive Protocol Member access (view-only).<br/>Contact admin to request editing permissions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

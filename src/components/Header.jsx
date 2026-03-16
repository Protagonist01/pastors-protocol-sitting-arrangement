import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { RoleTag } from './UI';
import { LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function Header({ confName, sessionName }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isDashboard = location.pathname === '/';

  return (
    <header style={{ background:'#051008ee', borderBottom:'1px solid #143d22', padding:'0 20px',
      display:'flex', alignItems:'center', height:60, gap:10, position:'sticky',
      top:0, zIndex:100, backdropFilter:'blur(10px)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', flexShrink:0 }}
        onClick={() => navigate('/')}>
        <img src="/logo.png" alt="GLT Logo" style={{ height: 32, objectFit: 'contain' }} />
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, color:'#c9a84c', fontWeight:700, lineHeight:1.1 }}>Pastors' Protocol</div>
          <div style={{ fontSize:9, color:'#4f6b56', letterSpacing:.8, textTransform:'uppercase' }}>Central Sitting Arrangement</div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:4, flex:1, overflow:'hidden', padding:'0 4px' }}>
        <span style={{ color:'#143d22', fontSize:16 }}>/</span>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}
          style={{ color: isDashboard ? '#c9a84c' : '#8cb398', fontSize:12 }}>Conferences</button>
        {confName && <>
          <span style={{ color:'#143d22', fontSize:16 }}>/</span>
          <button className="btn btn-ghost btn-sm"
            style={{ color: !sessionName ? '#c9a84c' : '#8cb398', fontSize:12,
              maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {confName}
          </button>
        </>}
        {sessionName && <>
          <span style={{ color:'#143d22', fontSize:16 }}>/</span>
          <span style={{ fontSize:12, color:'#c9a84c', maxWidth:160,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {sessionName}
          </span>
        </>}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:13, color:'#e2f0e6', fontWeight:500, lineHeight:1.3 }}>{profile?.name || user?.email}</div>
          <RoleTag role={profile?.role}/>
        </div>
        <div style={{ width:34, height:34, borderRadius:'50%',
          background:`${profile?.role==='admin'?'#c9a84c':profile?.role==='editor'?'#2471a3':'#27ae60'}22`,
          border:`2px solid ${profile?.role==='admin'?'#c9a84c':profile?.role==='editor'?'#2471a3':'#27ae60'}55`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:15, fontWeight:600, color:'#e2f0e6', flexShrink:0 }}>
          {(profile?.name || user?.email)?.[0]?.toUpperCase()}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Sign out" style={{ fontSize:16 }}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

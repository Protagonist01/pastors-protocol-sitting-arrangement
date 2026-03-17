import { useState } from 'react';
import { useAuth } from './auth-context';
import { supabase } from '../lib/supabase';
import { RoleTag } from './UI';
import { LogOut, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function Header({ confName, sessionName }) {
  const { user, profile, reloadProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRefreshProfile = async () => {
    console.log('Refreshing profile...');
    await reloadProfile();
    console.log('Profile after refresh:', profile);
  };

  const isDashboard = location.pathname === '/';
  const roleColor = profile?.role === 'admin' ? '#c9a84c' : profile?.role === 'editor' ? '#2471a3' : '#27ae60';

  return (
    <>
      <header className="app-header">
        <div className="header-logo" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="GLT Logo" />
          <div>
            <div className="header-logo-title">Pastors&apos; Protocol</div>
            <div className="header-logo-sub">Central Sitting Arrangement</div>
          </div>
        </div>

        <div className="header-breadcrumbs">
          <span className="header-breadcrumb-sep">/</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}
            style={{ color: isDashboard ? '#c9a84c' : '#8cb398', fontSize: 12 }}>Conferences</button>
          {confName && <>
            <span className="header-breadcrumb-sep">/</span>
            <button className="btn btn-ghost btn-sm"
              style={{ color: !sessionName ? '#c9a84c' : '#8cb398', fontSize: 12,
                maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {confName}
            </button>
          </>}
          {sessionName && <>
            <span className="header-breadcrumb-sep">/</span>
            <span style={{ fontSize: 12, color: '#c9a84c', maxWidth: 160,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sessionName}
            </span>
          </>}
        </div>

        <div className="header-user">
          <div className="header-user-info">
            <div className="header-user-name">{profile?.name || user?.email || 'Loading...'}</div>
            <RoleTag role={profile?.role}/>
          </div>
          <div className="header-avatar"
            style={{ background: `${roleColor}22`, border: `2px solid ${roleColor}55` }}>
            {(profile?.name || user?.email)?.[0]?.toUpperCase()}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleRefreshProfile} title="Refresh profile" style={{ fontSize: 16 }}>
            ↻
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Sign out" style={{ fontSize: 16 }}>
            <LogOut size={16} />
          </button>
        </div>

        <button className="header-mobile-toggle" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer overlay */}
      <div className={`header-drawer-overlay ${drawerOpen ? '' : 'hidden'}`}
        onClick={() => setDrawerOpen(false)} />
      <div className={`header-mobile-drawer ${drawerOpen ? '' : 'hidden'}`}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div className="header-logo-title" style={{ fontSize:16 }}>Menu</div>
          <button className="btn btn-ghost" onClick={() => setDrawerOpen(false)} style={{ padding:4 }}>
            <X size={20} />
          </button>
        </div>

        {/* User info in drawer */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0', borderBottom:'1px solid #143d22', marginBottom:12 }}>
          <div className="header-avatar"
            style={{ background: `${roleColor}22`, border: `2px solid ${roleColor}55` }}>
            {(profile?.name || user?.email)?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="header-user-name">{profile?.name || user?.email}</div>
            <RoleTag role={profile?.role}/>
          </div>
        </div>

        {/* Nav links in drawer */}
        <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', padding:'10px 8px', color: isDashboard ? '#c9a84c' : '#8cb398' }}
          onClick={() => { navigate('/'); setDrawerOpen(false); }}>
          📋 Conferences
        </button>
        {profile?.role === 'admin' && (
          <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', padding:'10px 8px', color: location.pathname === '/users' ? '#c9a84c' : '#8cb398' }}
            onClick={() => { navigate('/users'); setDrawerOpen(false); }}>
            👥 Users
          </button>
        )}
        {confName && (
          <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', padding:'10px 8px', color: !sessionName ? '#c9a84c' : '#8cb398' }}
            onClick={() => setDrawerOpen(false)}>
            📁 {confName}
          </button>
        )}
        {sessionName && (
          <div style={{ padding:'10px 8px', color:'#c9a84c', fontSize:13 }}>
            🪑 {sessionName}
          </div>
        )}

        <div style={{ marginTop:'auto', paddingTop:20, borderTop:'1px solid #143d22' }}>
          <button className="btn btn-outline" style={{ width:'100%' }} onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

import { LucideLoader2, X } from 'lucide-react';

export function Toast({ msg, type }) {
  const c = type === 'error' ? '#ef4444' : '#22c55e';
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#0a1a10',
      border:`1px solid ${c}44`, borderLeft:`3px solid ${c}`, borderRadius:8,
      padding:'11px 18px', color:'#e2f0e6', fontSize:13, animation:'toastIn .3s ease',
      boxShadow:'0 4px 20px rgba(0,0,0,.5)', maxWidth:340 }}>
      {msg}
    </div>
  );
}

export function Loader({ text = "Loading Protocol System…" }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#051008', flexDirection:'column', gap:14 }}>
      <LucideLoader2 className="animate-spin text-amber-500" size={38} />
      <p style={{ color:'#4f6b56', fontSize:13 }}>{text}</p>
    </div>
  );
}

export function Modal({ children, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(5,16,8,.88)',
      backdropFilter:'blur(5px)', zIndex:1000, display:'flex', alignItems:'center',
      justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#0a1a10', border:'1px solid #143d22', borderRadius:16,
        maxWidth:640, width:'100%', maxHeight:'92vh', overflow:'auto',
        animation:'slideUp .25s ease', boxShadow:'0 24px 70px rgba(0,0,0,.7)' }}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, sub, onClose }) {
  return (
    <div style={{ padding:'20px 24px', borderBottom:'1px solid #143d22', display:'flex',
      alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
      <div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#c9a84c',
          fontWeight:700, lineHeight:1.2 }}>{title}</h2>
        {sub && <p style={{ fontSize:12, color:'#4f6b56', marginTop:3 }}>{sub}</p>}
      </div>
      <button className="btn btn-ghost" onClick={onClose}
        style={{ fontSize:22, lineHeight:1, padding:'4px 8px', flexShrink:0 }}><X size={20}/></button>
    </div>
  );
}

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom:15 }}>
      <label style={{ display:'block', fontSize:11, color:'#8cb398', marginBottom:5,
        textTransform:'uppercase', letterSpacing:'.8px', fontWeight:500 }}>{label}</label>
      {children}
    </div>
  );
}

export function RoleTag({ role }) {
  const map = {
    admin:    { c:'#c9a84c', l:'Administrator'    },
    editor:   { c:'#2471a3', l:'Editor'           },
    protocol: { c:'#27ae60', l:'Protocol Member'  },
  };
  const r = map[role] || map.protocol;
  return <span style={{ fontSize:9, color:r.c, textTransform:'uppercase', letterSpacing:'.8px', fontWeight:600 }}>{r.l}</span>;
}

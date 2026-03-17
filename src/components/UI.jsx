import { Loader2, X } from 'lucide-react';

export function Toast({ msg, type }) {
  const c = type === 'error' ? '#ef4444' : '#22c55e';
  return (
    <div className="toast"
      style={{ border:`1px solid ${c}44`, borderLeft:`3px solid ${c}` }}>
      {msg}
    </div>
  );
}

export function Loader({ text = "Loading Protocol System…" }) {
  return (
    <div className="loader-screen">
      <Loader2 className="loader-spin" size={38} />
      <p className="loader-text">{text}</p>
    </div>
  );
}

export function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, sub, onClose }) {
  return (
    <div className="modal-header-bar">
      <div>
        <h2 className="modal-header-title">{title}</h2>
        {sub && <p className="modal-header-sub">{sub}</p>}
      </div>
      <button className="btn btn-ghost" onClick={onClose}
        style={{ fontSize:22, lineHeight:1, padding:'4px 8px', flexShrink:0 }}><X size={20}/></button>
    </div>
  );
}

export function FormField({ label, children }) {
  return (
    <div className="form-field">
      <label className="form-field-label">{label}</label>
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
  return <span className="role-tag" style={{ color:r.c }}>{r.l}</span>;
}

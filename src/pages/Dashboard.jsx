import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Loader, Modal, ModalHeader, FormField } from '../components/UI';
import { Header } from '../components/Header';
import { format } from 'date-fns';
import { useConferences } from '../hooks/useConferences';

function ConfForm({ isEdit, onSave, onCancel }) {
  const [f, setF] = useState({ name:'', date:'', venue:'', description:'' });
  const s = (k, v) => setF(x => ({ ...x, [k]:v }));
  
  return <>
    <ModalHeader title={isEdit ? 'Edit Conference' : 'New Conference'} onClose={onCancel}/>
    <div style={{ padding:24 }}>
      <FormField label="Conference Name *"><input className="input" placeholder="General Council 2025" value={f.name} onChange={e=>s('name',e.target.value)}/></FormField>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <FormField label="Date"><input className="input" type="date" value={f.date} onChange={e=>s('date',e.target.value)}/></FormField>
        <FormField label="Venue"><input className="input" placeholder="National Auditorium, Accra" value={f.venue} onChange={e=>s('venue',e.target.value)}/></FormField>
      </div>
      <FormField label="Description"><textarea className="input" rows={3} placeholder="Brief overview…" value={f.description} onChange={e=>s('description',e.target.value)} style={{ resize:'vertical' }}/></FormField>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-gold" onClick={() => f.name && onSave(f)} disabled={!f.name}>{isEdit ? 'Save Changes' : 'Create Conference'}</button>
      </div>
    </div>
  </>;
}

export function Dashboard() {
  const { isEditorOrAdmin } = useAuth();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);

  const { conferencesQuery, createConference, deleteConference } = useConferences();
  const { data: confs, isLoading } = conferencesQuery;

  if (isLoading) return <Loader text="Loading Conferences..." />;

  const confList = confs || [];

  return (
    <div>
      <Header />
      <div style={{ padding:'28px 22px', maxWidth:1100, margin:'0 auto' }} className="fade-in">
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between',
          marginBottom:28, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, color:'#c9a84c', fontWeight:700, marginBottom:4 }}>Conferences</h1>
            <p style={{ color:'#4f6b56', fontSize:13 }}>{confList.length} conference{confList.length!==1?'s':''} on record</p>
          </div>
          {isEditorOrAdmin && <button className="btn btn-gold" onClick={() => setShowNew(true)}>+ New Conference</button>}
        </div>

        {confList.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'#4f6b56' }}>
            <div style={{ marginBottom:16, opacity:.4 }}><img src="/logo.png" style={{ height: 60 }} alt="" /></div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#143d22', marginBottom:8 }}>No conferences yet</p>
            {isEditorOrAdmin && <p style={{ fontSize:13 }}>Create your first conference to get started</p>}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
            {confList.map((c, i) => (
              <div key={c.id} className="card card-hover"
                style={{ padding:22, cursor:'pointer', animationDelay:`${i*.05}s` }}
                onClick={() => navigate(`/conference/${c.id}`)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#e2f0e6', marginBottom:4, lineHeight:1.3 }}>{c.name}</h3>
                    <p style={{ fontSize:12, color:'#4f6b56' }}>
                      {c.date ? format(new Date(c.date), 'dd MMM yyyy') : '—'} 
                      {c.venue ? ` • ${c.venue}` : ''}
                    </p>
                  </div>
                  {isEditorOrAdmin && (
                    <button className="btn btn-ghost btn-sm" style={{ color:'#ef4444', flexShrink:0 }}
                      onClick={e => { e.stopPropagation(); if (window.confirm('Delete this conference and all its sessions?')) deleteConference.mutate(c.id); }}>🗑</button>
                  )}
                </div>
                {c.description && <p style={{ fontSize:13, color:'#8cb398', marginBottom:12, lineHeight:1.55 }}>{c.description}</p>}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                  <span style={{ background:'#c9a84c0e', border:'1px solid #c9a84c22', color:'#c9a84c',
                    borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:600 }}>
                    Manage Sessions →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <Modal onClose={() => setShowNew(false)}>
          <ConfForm isEdit={false} onSave={(f) => {
            createConference.mutate(f, { onSuccess: () => setShowNew(false) })
          }} onCancel={() => setShowNew(false)} />
        </Modal>
      )}
    </div>
  );
}

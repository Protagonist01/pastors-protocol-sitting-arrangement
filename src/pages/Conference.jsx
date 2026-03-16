import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Loader, Modal, ModalHeader, FormField } from '../components/UI';
import { Header } from '../components/Header';
import { format } from 'date-fns';
import { useConferences } from '../hooks/useConferences';
import { useSessions } from '../hooks/useSessions';

function SessionForm({ isEdit, confId, onSave, onCancel }) {
  const [f, setF] = useState({ name:'', date:'', time:'', description:'' });
  const s = (k, v) => setF(x => ({ ...x, [k]:v }));
  
  return <>
    <ModalHeader title={isEdit ? 'Edit Session' : 'New Session'} onClose={onCancel}/>
    <div style={{ padding:24 }}>
      <FormField label="Session Name *"><input className="input" placeholder="Opening Night" value={f.name} onChange={e=>s('name',e.target.value)}/></FormField>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <FormField label="Date"><input className="input" type="date" value={f.date} onChange={e=>s('date',e.target.value)}/></FormField>
        <FormField label="Time"><input className="input" type="time" value={f.time} onChange={e=>s('time',e.target.value)}/></FormField>
      </div>
      <FormField label="Description"><textarea className="input" rows={3} placeholder="Brief overview…" value={f.description} onChange={e=>s('description',e.target.value)} style={{ resize:'vertical' }}/></FormField>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-gold" onClick={() => f.name && onSave({ ...f, conference_id: confId })} disabled={!f.name}>{isEdit ? 'Save Changes' : 'Add Session'}</button>
      </div>
    </div>
  </>;
}

export function Conference() {
  const { confId } = useParams();
  const navigate = useNavigate();
  const { isEditorOrAdmin } = useAuth();
  const [showNew, setShowNew] = useState(false);

  const { conferenceQuery } = useConferences();
  const { data: conf, isLoading: isLoadingConf } = conferenceQuery(confId);

  const { sessionsQuery, createSession, deleteSession } = useSessions(confId);
  const { data: sessions, isLoading: isLoadingSessions } = sessionsQuery;

  if (isLoadingConf || isLoadingSessions) return <Loader text="Loading Conference Details..." />;
  if (!conf) return <div style={{ color:'white', textAlign:'center', marginTop:100 }}>Conference not found.</div>;

  const sessList = sessions || [];

  return (
    <div>
      <Header confName={conf.name} />
      
      <div style={{ padding:'28px 22px', maxWidth:1100, margin:'0 auto' }} className="fade-in">
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, color:'#c9a84c', fontWeight:700, marginBottom:5 }}>{conf.name}</h1>
            <p style={{ fontSize:13, color:'#4f6b56', marginBottom:4 }}>
              {conf.date ? format(new Date(conf.date), 'dd MMM yyyy') : '—'} 
              {conf.venue ? ` • ${conf.venue}` : ''}
            </p>
            {conf.description && <p style={{ color:'#8cb398', fontSize:14, maxWidth:600, lineHeight:1.55 }}>{conf.description}</p>}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {/* <button className="btn btn-outline btn-sm">✏ Edit</button> */}
            {isEditorOrAdmin && <button className="btn btn-gold btn-sm" onClick={() => setShowNew(true)}>+ Add Session</button>}
          </div>
        </div>

        {sessList.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'#4f6b56' }}>
            <div style={{ fontSize:44, marginBottom:16, opacity:.15 }}>📋</div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#143d22', marginBottom:8 }}>No sessions yet</p>
            {isEditorOrAdmin && <p style={{ fontSize:13 }}>Add sessions to configure seating arrangements</p>}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:14 }}>
            {sessList.map((s, i) => (
              <div key={s.id} className="card card-hover"
                style={{ padding:22, cursor:'pointer', animationDelay:`${i*.05}s` }}
                onClick={() => navigate(`/session/${s.id}`)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:19, color:'#e2f0e6', marginBottom:4, lineHeight:1.3 }}>{s.name}</h3>
                    <p style={{ fontSize:12, color:'#4f6b56' }}>
                      {s.date ? format(new Date(s.date), 'dd MMM yyyy') : '—'}
                      {s.time ? ` at ${s.time}` : ''}
                    </p>
                  </div>
                  {isEditorOrAdmin && (
                    <button className="btn btn-ghost btn-sm" style={{ color:'#ef4444', flexShrink:0 }}
                      onClick={e => { e.stopPropagation(); if (window.confirm('Delete session?')) deleteSession.mutate(s.id); }}>🗑</button>
                  )}
                </div>
                {s.description && <p style={{ fontSize:12, color:'#8cb398', lineHeight:1.5, marginBottom:10 }}>{s.description}</p>}
                <div style={{ marginTop:10 }}>
                  <span style={{ background:'#4f6b560e', border:'1px solid #4f6b5622', color:'#4f6b56', borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:600 }}>View Seating →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <Modal onClose={() => setShowNew(false)}>
          <SessionForm confId={confId} isEdit={false} onSave={(f) => {
             createSession.mutate(f, { onSuccess: () => setShowNew(false) })
          }} onCancel={() => setShowNew(false)} />
        </Modal>
      )}
    </div>
  );
}

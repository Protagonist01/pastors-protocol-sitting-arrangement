import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { Loader, Modal, ModalHeader, FormField } from '../components/UI';
import { Header } from '../components/Header';
import { format } from 'date-fns';
import { useConference } from '../hooks/useConferences';
import { useSessions } from '../hooks/useSessions';

function SessionForm({ isEdit, onSave, onCancel }) {
  const [f, setF] = useState({ name:'', date:'', time:'', description:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const s = (k, v) => setF(x => ({ ...x, [k]:v }));

  const handleSave = async () => {
    if (!f.name) return;
    setSaving(true);
    setError('');
    try {
      const cleaned = Object.fromEntries(
        Object.entries(f).map(([k, v]) => [k, v === '' ? null : v])
      );
      await onSave(cleaned);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : err?.message || 'Failed to create session';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };
  
  return <>
    <ModalHeader title={isEdit ? 'Edit Session' : 'New Session'} onClose={onCancel}/>
    <div className="modal-body">
      {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13, padding: 8, background: '#ef444422', borderRadius: 6 }}>{error}</p>}
      <FormField label="Session Name *"><input className="input" placeholder="Opening Night" value={f.name} onChange={e=>s('name',e.target.value)}/></FormField>
      <div className="form-grid-2">
        <FormField label="Date"><input className="input" type="date" value={f.date} onChange={e=>s('date',e.target.value)}/></FormField>
        <FormField label="Time"><input className="input" type="time" value={f.time} onChange={e=>s('time',e.target.value)}/></FormField>
      </div>
      <FormField label="Description"><textarea className="input" rows={3} placeholder="Brief overview…" value={f.description} onChange={e=>s('description',e.target.value)} style={{ resize:'vertical' }}/></FormField>
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-gold" onClick={handleSave} disabled={!f.name || saving}>{saving ? 'Creating...' : (isEdit ? 'Save Changes' : 'Add Session')}</button>
      </div>
    </div>
  </>;
}

export function Conference() {
  const { confId } = useParams();
  const navigate = useNavigate();
  const { isEditorOrAdmin } = useAuth();
  const [showNew, setShowNew] = useState(false);

  const { data: conf, isLoading: isLoadingConf } = useConference(confId);

  const { sessionsQuery, createSession, deleteSession } = useSessions(confId);
  const { data: sessions, isLoading: isLoadingSessions } = sessionsQuery;

  if (isLoadingConf || isLoadingSessions) return <Loader text="Loading Conference Details..." />;
  if (!conf) return <div className="empty-state" style={{ marginTop:100 }}>Conference not found.</div>;

  const sessList = sessions || [];

  return (
    <div>
      <Header confName={conf.name} />
      
      <div className="page-container fade-in">
        <div className="page-header page-header--start">
          <div>
            <h1 className="page-title">{conf.name}</h1>
            <p className="page-subtitle">
              {conf.date ? format(new Date(conf.date), 'dd MMM yyyy') : '—'} 
              {conf.venue ? ` • ${conf.venue}` : ''}
            </p>
            {conf.description && <p className="page-description">{conf.description}</p>}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {isEditorOrAdmin && <button className="btn btn-gold btn-sm" onClick={() => setShowNew(true)}>+ Add Session</button>}
          </div>
        </div>

        {sessList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">No sessions yet</p>
            {isEditorOrAdmin && <p className="empty-state-sub">Add sessions to configure seating arrangements</p>}
          </div>
        ) : (
          <div className="grid-cards">
            {sessList.map((s, i) => (
              <div key={s.id} className="card card-hover session-card"
                style={{ animationDelay:`${i*.05}s` }}
                onClick={() => navigate(`/session/${s.id}`)}>
                <div className="card-top-row">
                  <div>
                    <h3 className="session-card-title">{s.name}</h3>
                    <p className="session-card-meta">
                      {s.date ? format(new Date(s.date), 'dd MMM yyyy') : '—'}
                      {s.time ? ` at ${s.time}` : ''}
                    </p>
                  </div>
                  {isEditorOrAdmin && (
                    <button className="btn btn-ghost btn-sm" style={{ color:'#ef4444', flexShrink:0 }}
                      onClick={e => { e.stopPropagation(); if (window.confirm('Delete session?')) deleteSession.mutate(s.id); }}>🗑</button>
                  )}
                </div>
                {s.description && <p className="session-card-desc">{s.description}</p>}
                <div className="card-badge-row">
                  <span className="card-badge card-badge--muted">View Seating →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <Modal onClose={() => setShowNew(false)}>
          <SessionForm isEdit={false} onSave={async (f) => {
            try {
              await createSession.mutateAsync(f);
              setShowNew(false);
            } catch (err) {
              const detail = err?.response?.data?.detail;
              const msg = typeof detail === 'string' ? detail
                : Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
                : typeof err?.message === 'string' ? err.message
                : 'Failed to create session';
              throw new Error(msg);
            }
          }} onCancel={() => setShowNew(false)} />
        </Modal>
      )}
    </div>
  );
}

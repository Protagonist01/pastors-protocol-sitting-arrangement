import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { Loader, Modal, ModalHeader, FormField } from '../components/UI';
import { Header } from '../components/Header';
import { format } from 'date-fns';
import { useConferences } from '../hooks/useConferences';

function ConfForm({ isEdit, onSave, onCancel }) {
  const [f, setF] = useState({ name:'', date:'', venue:'', description:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const s = (k, v) => setF(x => ({ ...x, [k]:v }));

  const handleSave = async () => {
    if (!f.name) return;
    setSaving(true);
    setError('');
    try {
      await onSave(f);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create conference';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };
  
  return <>
    <ModalHeader title={isEdit ? 'Edit Conference' : 'New Conference'} onClose={onCancel}/>
    <div className="modal-body">
      {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13, padding: 8, background: '#ef444422', borderRadius: 6 }}>{error}</p>}
      <FormField label="Conference Name *"><input className="input" placeholder="General Council 2025" value={f.name} onChange={e=>s('name',e.target.value)}/></FormField>
      <div className="form-grid-2">
        <FormField label="Date"><input className="input" type="date" value={f.date} onChange={e=>s('date',e.target.value)}/></FormField>
        <FormField label="Venue"><input className="input" placeholder="National Auditorium, Accra" value={f.venue} onChange={e=>s('venue',e.target.value)}/></FormField>
      </div>
      <FormField label="Description"><textarea className="input" rows={3} placeholder="Brief overview…" value={f.description} onChange={e=>s('description',e.target.value)} style={{ resize:'vertical' }}/></FormField>
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-gold" onClick={handleSave} disabled={!f.name || saving}>{saving ? 'Creating...' : (isEdit ? 'Save Changes' : 'Create Conference')}</button>
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
      <div className="page-container fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Conferences</h1>
            <p className="page-subtitle">{confList.length} conference{confList.length!==1?'s':''} on record</p>
          </div>
          {isEditorOrAdmin && <button className="btn btn-gold" onClick={() => setShowNew(true)}>+ New Conference</button>}
        </div>

        {confList.length === 0 ? (
          <div className="empty-state">
            <div style={{ marginBottom:16, opacity:.4 }}><img src="/logo.png" style={{ height: 60 }} alt="" /></div>
            <p className="empty-state-text">No conferences yet</p>
            {isEditorOrAdmin && <p className="empty-state-sub">Create your first conference to get started</p>}
          </div>
        ) : (
          <div className="grid-cards grid-cards--wide">
            {confList.map((c, i) => (
              <div key={c.id} className="card card-hover card-content"
                style={{ animationDelay:`${i*.05}s` }}
                onClick={() => navigate(`/conference/${c.id}`)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <h3 className="card-title">{c.name}</h3>
                    <p className="card-meta">
                      {c.date ? format(new Date(c.date), 'dd MMM yyyy') : '—'} 
                      {c.venue ? ` • ${c.venue}` : ''}
                    </p>
                  </div>
                  {isEditorOrAdmin && (
                    <button className="btn btn-ghost btn-sm" style={{ color:'#ef4444', flexShrink:0 }}
                      onClick={e => { e.stopPropagation(); if (window.confirm('Delete this conference and all its sessions?')) deleteConference.mutate(c.id); }}>🗑</button>
                  )}
                </div>
                {c.description && <p className="card-desc">{c.description}</p>}
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
          <ConfForm isEdit={false} onSave={async (f) => {
            try {
              await createConference.mutateAsync(f);
              setShowNew(false);
            } catch (err) {
              const msg = err.response?.data?.detail || err.message || 'Failed to create conference';
              throw new Error(msg);
            }
          }} onCancel={() => setShowNew(false)} />
        </Modal>
      )}
    </div>
  );
}

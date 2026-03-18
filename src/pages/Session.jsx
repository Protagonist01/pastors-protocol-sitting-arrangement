import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { Loader, Modal, ModalHeader, FormField } from '../components/UI';
import { Header } from '../components/Header';
import { VenueMap } from '../components/VenueMap';
import { SeatGrid } from '../components/SeatGrid';
import { AttendeeProfile } from '../components/AttendeeProfile';
import { SECTIONS, OPEN_SECTIONS, STATUSES, statusColor } from '../lib/constants';
import { format } from 'date-fns';
import { useSessionData } from '../hooks/useSessions';
import { useDignitaries } from '../hooks/useAttendees';
import { useConferences } from '../hooks/useConferences';
import { useSessions } from '../hooks/useSessions';
import { api } from '../services/apiClient';

function DignitaryForm({ init = {}, isEdit, sessionId, onSave, onCancel }) {
  const [f, setF] = useState({ name:'', title:'', church:'', extension:'', section:'', row_num:'', col_num:'', status:'pending', notes:'', ...init });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const s = (k, v) => setF(x => ({ ...x, [k]:v }));

  const handleSave = async () => {
    if (!f.name || !f.title) return;
    setSaving(true);
    setError('');
    try {
      const cleaned = Object.fromEntries(
        Object.entries(f).map(([k, v]) => [k, v === '' ? null : v])
      );
      await onSave({ ...cleaned, session_id: sessionId });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : err?.message || (isEdit ? 'Failed to update dignitary' : 'Failed to register dignitary');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return <>
    <ModalHeader title={isEdit ? 'Edit Dignitary' : 'Register Dignitary'} onClose={onCancel}/>
    <div className="modal-body">
      {error && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 13, padding: 8, background: '#ef444422', borderRadius: 6 }}>{error}</p>}
      <div className="form-row">
        <div style={{ flex:1 }}>
          <FormField label="Name *"><input className="input" placeholder="John Mensah" value={f.name} onChange={e=>s('name',e.target.value)}/></FormField>
        </div>
        <div className="form-col-narrow">
          <FormField label="Title *"><input className="input" placeholder="e.g. Presiding Bishop, H.E., Pastor" value={f.title} onChange={e=>s('title',e.target.value)}/></FormField>
        </div>
      </div>
      
      <div className="form-grid-2" style={{ marginBottom:16 }}>
        <FormField label="Church"><input className="input" placeholder="GLT" value={f.church} onChange={e=>s('church',e.target.value)}/></FormField>
        <FormField label="Branch / Extension"><input className="input" placeholder="North Campus" value={f.extension} onChange={e=>s('extension',e.target.value)}/></FormField>
      </div>

      <div className="seating-assignment-box">
        <div className="seating-assignment-label">Seating Assignment</div>
        <div className="form-row">
          <div style={{ flex:1.5 }}>
            <FormField label="Section">
              <select className="input" value={f.section} onChange={e=>s('section',e.target.value)}>
                <option value="">Unassigned</option>
                {OPEN_SECTIONS.map(sec => <option key={sec.id} value={sec.id}>{sec.label}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ flex:1, opacity: f.section ? 1 : 0.4, pointerEvents: f.section ? 'auto' : 'none' }}>
            <FormField label="Row"><input className="input" type="number" min="1" value={f.row_num} onChange={e=>s('row_num',e.target.value?parseInt(e.target.value):'')}/></FormField>
          </div>
          <div style={{ flex:1, opacity: f.section ? 1 : 0.4, pointerEvents: f.section ? 'auto' : 'none' }}>
            <FormField label="Seat / Col"><input className="input" type="number" min="1" value={f.col_num} onChange={e=>s('col_num',e.target.value?parseInt(e.target.value):'')}/></FormField>
          </div>
        </div>
      </div>
      
      <FormField label="Protocol Notes"><textarea className="input" rows={2} placeholder="Any special requirements..." value={f.notes} onChange={e=>s('notes',e.target.value)} style={{ resize:'vertical' }}/></FormField>
      
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-gold" onClick={handleSave} disabled={!f.name || !f.title || saving}>{saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Register Dignitary')}</button>
      </div>
    </div>
  </>;
}

function DignitaryList({ attendees, canEdit, onView, onEdit, onDelete, onStatus }) {
  const [fs,  setFs]  = useState('all');
  const [fst, setFst] = useState('all');
  const [q,   setQ]   = useState('');

  const filtered = attendees.filter(d => {
    if (fs  !== 'all' && d.section !== fs)  return false;
    if (fst !== 'all' && d.status  !== fst) return false;
    if (q && !d.name?.toLowerCase().includes(q.toLowerCase()) && !d.title?.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="filter-bar">
        <input className="input" placeholder="🔍 Search name or title…" value={q}
          onChange={e => setQ(e.target.value)} style={{ flex:1, minWidth:180 }}/>
        <select className="input filter-select" value={fs} onChange={e => setFs(e.target.value)}>
          <option value="all">All Sections</option>
          {OPEN_SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="input filter-select" value={fst} onChange={e => setFst(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p className="empty-state-text">No dignitaries found</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map(d => {
            const sec = SECTIONS.find(s => s.id === d.section);
            return (
              <div key={d.id} className="card card-hover attendee-card"
                onClick={() => onView(d)}>
                <div className="attendee-card-top">
                  <div className="attendee-avatar" style={{
                    borderColor: `${statusColor[d.status]||'#143d22'}44` }}>
                    {d.picture_url
                      ? <img src={d.picture_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : d.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="attendee-info">
                    <div className="attendee-name">{d.name}</div>
                    <div className="attendee-title">{d.title}</div>
                    {d.church && <div className="attendee-church">{d.church}{d.extension ? ` — ${d.extension}` : ''}</div>}
                  </div>
                </div>

                <div className="attendee-badges" style={{ marginBottom: canEdit ? 28 : 0 }}>
                  <span className={`badge ${d.status}`}>{STATUSES.find(s=>s.id===d.status)?.label}</span>
                  {sec && <span className="section-tag" style={{ color:sec.color, background:`${sec.color}11`,
                    borderColor:`${sec.color}33` }}>{sec.label}</span>}
                  {d.row_num && d.col_num && <span className="seat-ref">R{d.row_num}·S{d.col_num}</span>}
                </div>

                {canEdit && (
                  <div className="attendee-card-actions"
                    onClick={e => e.stopPropagation()}>
                    <select value={d.status} onChange={e => onStatus(d.id, e.target.value)}
                      className="inline-status-select"
                      style={{ color:statusColor[d.status] }}>
                      {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-sm" style={{ padding:'3px 7px', fontSize:13 }} onClick={() => onEdit(d)}>✏</button>
                    <button className="btn btn-ghost btn-sm" style={{ padding:'3px 7px', fontSize:13, color:'#ef4444' }}
                      onClick={() => { if (window.confirm('Remove this dignitary?')) onDelete(d.id); }}>🗑</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ImportArrangementModal({ targetSessionId, onClose, onSuccess }) {
  const [selectedConfId, setSelectedConfId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const { conferencesQuery } = useConferences();
  const { sessionsQuery } = useSessions(selectedConfId);
  const confs = conferencesQuery.data || [];
  const sessions = (sessionsQuery.data || []).filter(s => s.id !== targetSessionId);

  const handleSelectSession = async (sid) => {
    setSelectedSessionId(sid);
    if (sid) {
      try {
        const { data } = await api.get(`/sessions/${sid}/dignitaries`);
        setPreview(data || []);
      } catch {
        setPreview([]);
      }
    } else {
      setPreview(null);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');
    try {
      await api.post(`/sessions/${targetSessionId}/clone-from/${selectedSessionId}`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return <>
    <ModalHeader title="Import Arrangement" sub="Copy dignitaries from another session" onClose={onClose}/>
    <div className="modal-body">
      {error && <p style={{ color:'#ef4444', fontSize:13, padding:8, background:'#ef444422', borderRadius:6, marginBottom:12 }}>{error}</p>}

      <FormField label="1. Pick a Conference">
        <select className="input" value={selectedConfId} onChange={e => { setSelectedConfId(e.target.value); setSelectedSessionId(''); setPreview(null); }}>
          <option value="">— Select Conference —</option>
          {confs.map(c => <option key={c.id} value={c.id}>{c.name}{c.date ? ` (${format(new Date(c.date), 'dd MMM yyyy')})` : ''}</option>)}
        </select>
      </FormField>

      {selectedConfId && (
        <FormField label="2. Pick a Session to import from">
          {sessionsQuery.isLoading ? <p style={{ color:'#4f6b56', fontSize:13 }}>Loading sessions...</p> : (
            <select className="input" value={selectedSessionId} onChange={e => handleSelectSession(e.target.value)}>
              <option value="">— Select Session —</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}{s.date ? ` (${format(new Date(s.date), 'dd MMM yyyy')})` : ''}</option>)}
            </select>
          )}
          {sessions.length === 0 && !sessionsQuery.isLoading && <p style={{ color:'#4f6b56', fontSize:12, marginTop:4 }}>No other sessions in this conference</p>}
        </FormField>
      )}

      {preview !== null && (
        <div style={{ margin:'16px 0', padding:16, background:'#0a1a10', borderRadius:8, border:'1px solid #143d22' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#c9a84c', marginBottom:8 }}>Preview</div>
          {preview.length === 0
            ? <p style={{ color:'#4f6b56', fontSize:13 }}>This session has no dignitaries to import.</p>
            : <>
                <p style={{ color:'#e2f0e6', fontSize:13, marginBottom:8 }}><strong>{preview.length}</strong> dignitaries will be imported with status reset to <span style={{ color:'#64748b' }}>Pending</span>.</p>
                <div style={{ maxHeight:200, overflow:'auto', display:'flex', flexDirection:'column', gap:4 }}>
                  {preview.map(d => (
                    <div key={d.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 8px', background:'#0e2618', borderRadius:4, fontSize:12 }}>
                      <span style={{ color:'#c9a84c', fontWeight:600, minWidth:120 }}>{d.name}</span>
                      <span style={{ color:'#4f6b56' }}>{d.title}</span>
                      {d.section && <span style={{ color:'#2471a3', marginLeft:'auto' }}>{d.section}</span>}
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-outline" onClick={onClose} disabled={importing}>Cancel</button>
        <button className="btn btn-gold" onClick={handleImport} disabled={!selectedSessionId || !preview?.length || importing}>
          {importing ? 'Importing...' : `Import ${preview?.length || 0} Dignitaries`}
        </button>
      </div>
    </div>
  </>;
}

export function Session() {
  const { sessionId } = useParams();
  const { isEditorOrAdmin } = useAuth();
  
  const [tab, setTab] = useState('map');
  const [activeSec, setActiveSec] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingAtn, setEditingAtn] = useState(null);
  const [viewingAtn, setViewingAtn] = useState(null);
  const [prefillLoc, setPrefillLoc] = useState(null);

  const { data: sessionInfo, isLoading: loadingInfo } = useSessionData(sessionId);

  const { dignitariesQuery, createDignitary, updateDignitary, updateDignitaryStatus, deleteDignitary } = useDignitaries(sessionId);
  const { data: attendees = [], isLoading: loadingAtt } = dignitariesQuery;

  if (loadingInfo || loadingAtt) return <Loader text="Loading Session Data..." />;
  if (!sessionInfo) return <div className="empty-state" style={{ marginTop:100 }}>Session not found.</div>;

  const { session, conf } = sessionInfo;
  const stats = STATUSES.map(s => ({ ...s, cnt: attendees.filter(d => d.status === s.id).length }));

  const handleSeatClick = (r, c, d) => {
    if (d) setViewingAtn(d);
    else if (isEditorOrAdmin) {
      setPrefillLoc({ section: activeSec, row_num: r, col_num: c });
      setShowAddModal(true);
    }
  };

  return (
    <div>
      <Header confName={conf.name} sessionName={session.name} />
      
      <div className="page-container--wide fade-in">
        <div className="page-header page-header--start">
          <div>
            <h1 className="page-title">{session.name}</h1>
            <p className="page-subtitle">{conf.name} · {session.date ? format(new Date(session.date), 'dd MMM yyyy') : '—'}{session.time ? ` at ${session.time}` : ''}</p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {isEditorOrAdmin && <button className="btn btn-gold btn-sm" onClick={() => setShowAddModal(true)}>+ Register Dignitary</button>}
            {isEditorOrAdmin && <button className="btn btn-outline btn-sm" onClick={() => setShowImportModal(true)}>📋 Import Arrangement</button>}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="card stat-card">
            <div className="stat-value" style={{ color:'#c9a84c' }}>{attendees.length}</div>
            <div className="stat-label">Total</div>
          </div>
          {stats.map(s => (
            <div key={s.id} className="card stat-card">
              <div className="stat-value" style={{ color:s.color }}>{s.cnt}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {[{id:'map',l:'🗺  Seating Map'},{id:'list',l:'📋  Dignitary List'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`tab-btn ${tab===t.id ? 'active' : ''}`}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === 'map' && <>
          <VenueMap cfg={session.seating_config} attendees={attendees} activeSec={activeSec}
            onSec={id => setActiveSec(activeSec === id ? null : id)}/>
          {activeSec && (
            <div style={{ marginTop:16 }} className="fade-in">
              <SeatGrid sectionId={activeSec} cfg={session.seating_config} attendees={attendees} canEdit={isEditorOrAdmin}
                onSeatClick={handleSeatClick}/>
            </div>
          )}
        </>}

        {tab === 'list' && (
          <DignitaryList attendees={attendees} canEdit={isEditorOrAdmin} 
            onView={setViewingAtn} 
            onEdit={setEditingAtn} 
            onDelete={id => deleteDignitary.mutate(id)} 
            onStatus={(id, status) => updateDignitaryStatus.mutate({ id, status })}/>
        )}
      </div>

      {showAddModal && (
        <Modal onClose={() => { setShowAddModal(false); setPrefillLoc(null); }}>
          <DignitaryForm 
            sessionId={sessionId} 
            init={prefillLoc || {}} 
            isEdit={false} 
            onSave={async (data) => {
              await createDignitary.mutateAsync(data);
              setShowAddModal(false); setPrefillLoc(null);
            }} 
            onCancel={() => { setShowAddModal(false); setPrefillLoc(null); }} />
        </Modal>
      )}

      {editingAtn && (
        <Modal onClose={() => setEditingAtn(null)}>
          <DignitaryForm 
            sessionId={sessionId} 
            init={editingAtn} 
            isEdit={true} 
            onSave={async (data) => {
              await updateDignitary.mutateAsync({ id: editingAtn.id, data });
              setEditingAtn(null); if (viewingAtn) setViewingAtn(null);
            }} 
            onCancel={() => setEditingAtn(null)} />
        </Modal>
      )}

      {viewingAtn && (
        <Modal onClose={() => setViewingAtn(null)}>
          <AttendeeProfile 
            atn={viewingAtn} 
            canEdit={isEditorOrAdmin} 
            onEdit={() => { setEditingAtn(viewingAtn); setViewingAtn(null); }} 
            onStatus={(status) => {
               updateDignitaryStatus.mutate({ id: viewingAtn.id, status });
               setViewingAtn({ ...viewingAtn, status }); 
            }} 
            onClose={() => setViewingAtn(null)} />
        </Modal>
      )}

      {showImportModal && (
        <Modal onClose={() => setShowImportModal(false)}>
          <ImportArrangementModal
            targetSessionId={sessionId}
            onClose={() => setShowImportModal(false)}
            onSuccess={() => dignitariesQuery.refetch()}
          />
        </Modal>
      )}
    </div>
  );
}

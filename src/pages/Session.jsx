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
import { useAttendees } from '../hooks/useAttendees';

function AttendeeForm({ init = {}, isEdit, sessionId, onSave, onCancel }) {
  const [f, setF] = useState({ name:'', title:'Pastor', church:'', extension:'', section_id:'', row_num:'', col_num:'', status:'pending', notes:'', ...init });
  const s = (k, v) => setF(x => ({ ...x, [k]:v }));

  return <>
    <ModalHeader title={isEdit ? 'Edit Attendee' : 'Register Attendee'} onClose={onCancel}/>
    <div className="modal-body">
      <div className="form-row">
        <div style={{ flex:1 }}>
          <FormField label="Name *"><input className="input" placeholder="John Mensah" value={f.name} onChange={e=>s('name',e.target.value)}/></FormField>
        </div>
        <div className="form-col-narrow">
          <FormField label="Title"><input className="input" placeholder="Pastor" value={f.title} onChange={e=>s('title',e.target.value)}/></FormField>
        </div>
      </div>
      
      <div className="form-grid-2" style={{ marginBottom:16 }}>
        <FormField label="Church"><input className="input" placeholder="GLT" value={f.church} onChange={e=>s('church',e.target.value)}/></FormField>
        <FormField label="Branch / Ext."><input className="input" placeholder="North Campus" value={f.extension} onChange={e=>s('extension',e.target.value)}/></FormField>
      </div>

      <div className="seating-assignment-box">
        <div className="seating-assignment-label">Seating Assignment</div>
        <div className="form-row">
          <div style={{ flex:1.5 }}>
            <FormField label="Section">
              <select className="input" value={f.section_id} onChange={e=>s('section_id',e.target.value)}>
                <option value="">Unassigned</option>
                {OPEN_SECTIONS.map(sec => <option key={sec.id} value={sec.id}>{sec.label}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ flex:1, opacity: f.section_id ? 1 : 0.4, pointerEvents: f.section_id ? 'auto' : 'none' }}>
            <FormField label="Row"><input className="input" type="number" min="1" value={f.row_num} onChange={e=>s('row_num',e.target.value?parseInt(e.target.value):'')}/></FormField>
          </div>
          <div style={{ flex:1, opacity: f.section_id ? 1 : 0.4, pointerEvents: f.section_id ? 'auto' : 'none' }}>
            <FormField label="Seat / Col"><input className="input" type="number" min="1" value={f.col_num} onChange={e=>s('col_num',e.target.value?parseInt(e.target.value):'')}/></FormField>
          </div>
        </div>
      </div>
      
      <FormField label="Protocol Notes"><textarea className="input" rows={2} placeholder="Any special requirements..." value={f.notes} onChange={e=>s('notes',e.target.value)} style={{ resize:'vertical' }}/></FormField>
      
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-gold" onClick={() => f.name && onSave({ ...f, session_id: sessionId })} disabled={!f.name}>{isEdit ? 'Save Changes' : 'Register Attendee'}</button>
      </div>
    </div>
  </>;
}

function AttendeeList({ attendees, canEdit, onView, onEdit, onDelete, onStatus }) {
  const [fs,  setFs]  = useState('all');
  const [fst, setFst] = useState('all');
  const [q,   setQ]   = useState('');

  const filtered = attendees.filter(d => {
    if (fs  !== 'all' && d.section_id !== fs)  return false;
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
          <p className="empty-state-text">No attendees found</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map(d => {
            const sec = SECTIONS.find(s => s.id === d.section_id);
            return (
              <div key={d.id} className="card card-hover attendee-card"
                onClick={() => onView(d)}>
                <div className="attendee-card-top">
                  <div className="attendee-avatar" style={{
                    borderColor: `${statusColor[d.status]||'#143d22'}44` }}>
                    {d.picture
                      ? <img src={d.picture} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
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
                      onClick={() => { if (window.confirm('Remove this attendee?')) onDelete(d.id); }}>🗑</button>
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

export function Session() {
  const { sessionId } = useParams();
  const { isEditorOrAdmin } = useAuth();
  
  const [tab, setTab] = useState('map');
  const [activeSec, setActiveSec] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAtn, setEditingAtn] = useState(null);
  const [viewingAtn, setViewingAtn] = useState(null);
  const [prefillLoc, setPrefillLoc] = useState(null);

  const { data: sessionInfo, isLoading: loadingInfo } = useSessionData(sessionId);

  const { attendeesQuery, createAttendee, updateAttendee, updateAttendeeStatus, deleteAttendee } = useAttendees(sessionId);
  const { data: attendees = [], isLoading: loadingAtt } = attendeesQuery;

  if (loadingInfo || loadingAtt) return <Loader text="Loading Session Data..." />;
  if (!sessionInfo) return <div className="empty-state" style={{ marginTop:100 }}>Session not found.</div>;

  const { session, conf } = sessionInfo;
  const stats = STATUSES.map(s => ({ ...s, cnt: attendees.filter(d => d.status === s.id).length }));

  const handleSeatClick = (r, c, d) => {
    if (d) setViewingAtn(d);
    else if (isEditorOrAdmin) {
      setPrefillLoc({ section_id: activeSec, row_num: r, col_num: c });
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
            {isEditorOrAdmin && <button className="btn btn-gold btn-sm" onClick={() => setShowAddModal(true)}>+ Register Attendee</button>}
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
          {[{id:'map',l:'🗺  Seating Map'},{id:'list',l:'📋  Attendee List'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`tab-btn ${tab===t.id ? 'active' : ''}`}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === 'map' && <>
          <VenueMap cfg={session.seating_configs} attendees={attendees} activeSec={activeSec}
            onSec={id => setActiveSec(activeSec === id ? null : id)}/>
          {activeSec && (
            <div style={{ marginTop:16 }} className="fade-in">
              <SeatGrid sectionId={activeSec} cfg={session.seating_configs} attendees={attendees} canEdit={isEditorOrAdmin}
                onSeatClick={handleSeatClick}/>
            </div>
          )}
        </>}

        {tab === 'list' && (
          <AttendeeList attendees={attendees} canEdit={isEditorOrAdmin} 
            onView={setViewingAtn} 
            onEdit={setEditingAtn} 
            onDelete={id => deleteAttendee.mutate(id)} 
            onStatus={(id, status) => updateAttendeeStatus.mutate({ id, status })}/>
        )}
      </div>

      {showAddModal && (
        <Modal onClose={() => { setShowAddModal(false); setPrefillLoc(null); }}>
          <AttendeeForm 
            sessionId={sessionId} 
            init={prefillLoc || {}} 
            isEdit={false} 
            onSave={(data) => {
              createAttendee.mutate(data, { onSuccess: () => { setShowAddModal(false); setPrefillLoc(null); } })
            }} 
            onCancel={() => { setShowAddModal(false); setPrefillLoc(null); }} />
        </Modal>
      )}

      {editingAtn && (
        <Modal onClose={() => setEditingAtn(null)}>
          <AttendeeForm 
            sessionId={sessionId} 
            init={editingAtn} 
            isEdit={true} 
            onSave={(data) => {
              updateAttendee.mutate({ id: editingAtn.id, data }, { onSuccess: () => { setEditingAtn(null); if (viewingAtn) setViewingAtn(null); } })
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
               updateAttendeeStatus.mutate({ id: viewingAtn.id, status });
               setViewingAtn({ ...viewingAtn, status }); 
            }} 
            onClose={() => setViewingAtn(null)} />
        </Modal>
      )}
    </div>
  );
}

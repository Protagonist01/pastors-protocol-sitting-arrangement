import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Loader, Modal, ModalHeader, FormField } from '../components/UI';
import { Header } from '../components/Header';
import { VenueMap } from '../components/VenueMap';
import { SeatGrid } from '../components/SeatGrid';
import { AttendeeProfile } from '../components/AttendeeProfile';
import { SECTIONS, OPEN_SECTIONS, STATUSES, statusColor } from '../lib/constants';
import { format } from 'date-fns';
import { useSessions } from '../hooks/useSessions';
import { useAttendees } from '../hooks/useAttendees';

function AttendeeForm({ init = {}, isEdit, sessionId, onSave, onCancel }) {
  const [f, setF] = useState({ name:'', title:'Pastor', church:'', extension:'', section_id:'', row_num:'', col_num:'', status:'pending', notes:'', ...init });
  const s = (k, v) => setF(x => ({ ...x, [k]:v }));

  return <>
    <ModalHeader title={isEdit ? 'Edit Attendee' : 'Register Attendee'} onClose={onCancel}/>
    <div style={{ padding:'20px 24px' }}>
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <div style={{ flex:1 }}>
          <FormField label="Name *"><input className="input" placeholder="John Mensah" value={f.name} onChange={e=>s('name',e.target.value)}/></FormField>
        </div>
        <div style={{ width:140 }}>
          <FormField label="Title"><input className="input" placeholder="Pastor" value={f.title} onChange={e=>s('title',e.target.value)}/></FormField>
        </div>
      </div>
      
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        <FormField label="Church"><input className="input" placeholder="GLT" value={f.church} onChange={e=>s('church',e.target.value)}/></FormField>
        <FormField label="Branch / Ext."><input className="input" placeholder="North Campus" value={f.extension} onChange={e=>s('extension',e.target.value)}/></FormField>
      </div>

      <div style={{ padding:16, background:'#051a0a', borderRadius:8, border:'1px dashed #143d22', marginBottom:16 }}>
        <div style={{ fontSize:10, color:'#8cb398', marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>Seating Assignment</div>
        <div style={{ display:'flex', gap:10 }}>
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
      
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
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
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input className="input" placeholder="🔍 Search name or title…" value={q}
          onChange={e => setQ(e.target.value)} style={{ flex:1, minWidth:180 }}/>
        <select className="input" value={fs} onChange={e => setFs(e.target.value)} style={{ width:165 }}>
          <option value="all">All Sections</option>
          {OPEN_SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="input" value={fst} onChange={e => setFst(e.target.value)} style={{ width:145 }}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#4f6b56' }}>
          <div style={{ fontSize:38, marginBottom:12, opacity:.15 }}>👤</div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#143d22' }}>No attendees found</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:12 }}>
          {filtered.map(d => {
            const sec = SECTIONS.find(s => s.id === d.section_id);
            return (
              <div key={d.id} className="card card-hover"
                style={{ padding:16, cursor:'pointer', position:'relative' }}
                onClick={() => onView(d)}>
                <div style={{ display:'flex', gap:13, marginBottom:10 }}>
                  <div style={{ width:50, height:50, borderRadius:'50%', flexShrink:0, overflow:'hidden',
                    border:`2px solid ${statusColor[d.status]||'#143d22'}44`,
                    background:'#051008', display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:20, color:'#4f6b56' }}>
                    {d.picture
                      ? <img src={d.picture} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : d.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:600, color:'#e2f0e6', marginBottom:2,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                    <div style={{ fontSize:12, color:'#8cb398', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</div>
                    {d.church && <div style={{ fontSize:11, color:'#4f6b56', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.church}{d.extension ? ` — ${d.extension}` : ''}</div>}
                  </div>
                </div>

                <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom: canEdit ? 28 : 0 }}>
                  <span className={`badge ${d.status}`}>{STATUSES.find(s=>s.id===d.status)?.label}</span>
                  {sec && <span style={{ fontSize:10, color:sec.color, background:`${sec.color}11`,
                    border:`1px solid ${sec.color}33`, borderRadius:4, padding:'2px 6px' }}>{sec.label}</span>}
                  {d.row_num && d.col_num && <span style={{ fontSize:10, color:'#4f6b56' }}>R{d.row_num}·S{d.col_num}</span>}
                </div>

                {canEdit && (
                  <div style={{ position:'absolute', bottom:10, right:10, display:'flex', gap:4 }}
                    onClick={e => e.stopPropagation()}>
                    <select value={d.status} onChange={e => onStatus(d.id, e.target.value)}
                      style={{ background:'#051008', border:'1px solid #143d22', borderRadius:6,
                        color:statusColor[d.status], fontSize:10, padding:'3px 6px',
                        cursor:'pointer', fontFamily:"'DM Sans',sans-serif", outline:'none' }}>
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

  const { sessionDataQuery } = useSessions();
  const { data: sessionInfo, isLoading: loadingInfo } = sessionDataQuery(sessionId);

  const { attendeesQuery, createAttendee, updateAttendee, updateAttendeeStatus, deleteAttendee } = useAttendees(sessionId);
  const { data: attendees = [], isLoading: loadingAtt } = attendeesQuery;

  if (loadingInfo || loadingAtt) return <Loader text="Loading Session Data..." />;
  if (!sessionInfo) return <div style={{ color:'#e2f0e6', textAlign:'center', marginTop:100 }}>Session not found.</div>;

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
      
      <div style={{ padding:'24px 20px', maxWidth:1200, margin:'0 auto' }} className="fade-in">
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, color:'#c9a84c', fontWeight:700, marginBottom:4 }}>{session.name}</h1>
            <p style={{ fontSize:13, color:'#4f6b56' }}>{conf.name} · {session.date ? format(new Date(session.date), 'dd MMM yyyy') : '—'}{session.time ? ` at ${session.time}` : ''}</p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {/* {isEditorOrAdmin && <button className="btn btn-outline btn-sm">⚙ Section Capacity</button>} */}
            {isEditorOrAdmin && <button className="btn btn-gold btn-sm" onClick={() => setShowAddModal(true)}>+ Register Attendee</button>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:10, marginBottom:22, flexWrap:'wrap' }}>
          <div className="card" style={{ padding:'12px 18px', flex:1, minWidth:90, textAlign:'center' }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#c9a84c', fontWeight:700 }}>{attendees.length}</div>
            <div style={{ fontSize:10, color:'#4f6b56', textTransform:'uppercase', letterSpacing:1 }}>Total</div>
          </div>
          {stats.map(s => (
            <div key={s.id} className="card" style={{ padding:'12px 18px', flex:1, minWidth:80, textAlign:'center' }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:s.color, fontWeight:700 }}>{s.cnt}</div>
              <div style={{ fontSize:10, color:'#4f6b56', textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:18, background:'#051008', borderRadius:10,
          padding:4, width:'fit-content', border:'1px solid #143d22' }}>
          {[{id:'map',l:'🗺  Seating Map'},{id:'list',l:'📋  Attendee List'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'7px 18px', borderRadius:7, border:'none',
                background: tab===t.id ? '#0a1a10' : 'transparent',
                color: tab===t.id ? '#c9a84c' : '#4f6b56',
                cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, transition:'all .18s' }}>
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

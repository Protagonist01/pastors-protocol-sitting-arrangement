import { SECTIONS, STATUSES, statusColor } from '../lib/constants';
import { ModalHeader } from './UI';

export function AttendeeProfile({ atn, canEdit, onEdit, onStatus, onClose }) {
  const sec = SECTIONS.find(s => s.id === atn.section_id);
  
  return <>
    <ModalHeader title="Attendee Profile" sub={atn.church ? `${atn.church}${atn.extension ? ' — ' + atn.extension : ''}` : ''} onClose={onClose}/>
    <div style={{ padding:26 }}>
      <div style={{ display:'flex', gap:20, marginBottom:22, alignItems:'flex-start' }}>
        <div style={{ width:90, height:90, borderRadius:12, overflow:'hidden', flexShrink:0,
          border:`3px solid ${statusColor[atn.status]||'#143d22'}55`,
          background:'#051008', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:34, color:'#4f6b56' }}>
          {atn.picture
            ? <img src={atn.picture} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : atn.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:'#e2f0e6', marginBottom:3, lineHeight:1.2 }}>{atn.name}</h2>
          <p style={{ color:'#8cb398', fontSize:15, marginBottom:10 }}>{atn.title}</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span className={`badge ${atn.status}`}>{STATUSES.find(s=>s.id===atn.status)?.label}</span>
            {sec && <span style={{ fontSize:11, color:sec.color, background:`${sec.color}11`,
              border:`1px solid ${sec.color}33`, borderRadius:6, padding:'3px 9px', fontWeight:600 }}>{sec.label}</span>}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
        {[
          ['Seat Assignment', atn.row_num && atn.col_num ? `Row ${atn.row_num}, Column ${atn.col_num}` : 'Not yet assigned'],
          ['Section',         sec?.label || '—'],
          ['Church',          atn.church    || '—'],
          ['Extension / Branch', atn.extension || '—'],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ background:'#051008', borderRadius:8, padding:'11px 14px', border:'1px solid #143d22' }}>
            <div style={{ fontSize:10, color:'#4f6b56', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>{lbl}</div>
            <div style={{ fontSize:14, color:'#e2f0e6' }}>{val}</div>
          </div>
        ))}
      </div>

      {atn.notes && (
        <div style={{ background:'#051008', borderRadius:8, padding:'11px 14px', border:'1px solid #143d22', marginBottom:18 }}>
          <div style={{ fontSize:10, color:'#4f6b56', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Protocol Notes</div>
          <p style={{ fontSize:13, color:'#8cb398', lineHeight:1.6 }}>{atn.notes}</p>
        </div>
      )}

      {canEdit && <>
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:10, color:'#4f6b56', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Update Arrival Status</div>
          <div style={{ display:'flex', gap:8 }}>
            {STATUSES.map(s => (
              <button key={s.id} onClick={() => onStatus(s.id)}
                style={{ flex:1, padding:'8px 4px', borderRadius:8,
                  border:`1px solid ${s.color}${atn.status===s.id?'':44}`,
                  background: atn.status===s.id ? `${s.color}22` : 'transparent',
                  color:s.color, cursor:'pointer', fontSize:10, fontWeight:600,
                  fontFamily:"'DM Sans',sans-serif", transition:'all .15s',
                  opacity: atn.status===s.id ? 1 : .55 }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-gold btn-sm" onClick={onEdit}>✏ Edit Profile</button>
        </div>
      </>}
      {!canEdit && <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
      </div>}
    </div>
  </>;
}

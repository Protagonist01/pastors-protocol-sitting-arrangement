import { SECTIONS, STATUSES, statusColor } from '../lib/constants';
import { ModalHeader } from './UI';

export function AttendeeProfile({ atn, canEdit, onEdit, onStatus, onClose }) {
  const sec = SECTIONS.find(s => s.id === atn.section);
  
  return <>
    <ModalHeader title="Dignitary Profile" sub={atn.church ? `${atn.church}${atn.extension ? ' — ' + atn.extension : ''}` : ''} onClose={onClose}/>
    <div className="modal-body">
      <div className="profile-header">
        <div className="profile-avatar"
          style={{ border:`3px solid ${statusColor[atn.status]||'#143d22'}55` }}>
          {atn.picture_url
            ? <img src={atn.picture_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : atn.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <h2 className="profile-name">{atn.name}</h2>
          <p className="profile-title-text">{atn.title}</p>
          <div className="profile-tags">
            <span className={`badge ${atn.status}`}>{STATUSES.find(s=>s.id===atn.status)?.label}</span>
            {sec && <span style={{ fontSize:11, color:sec.color, background:`${sec.color}11`,
              border:`1px solid ${sec.color}33`, borderRadius:6, padding:'3px 9px', fontWeight:600 }}>{sec.label}</span>}
          </div>
        </div>
      </div>

      <div className="profile-info-grid">
        {[
          ['Seat Assignment', atn.row_num && atn.col_num ? `Row ${atn.row_num}, Column ${atn.col_num}` : 'Not yet assigned'],
          ['Section',         sec?.label || '—'],
          ['Church',          atn.church    || '—'],
          ['Extension / Branch', atn.extension || '—'],
        ].map(([lbl, val]) => (
          <div key={lbl} className="profile-info-cell">
            <div className="profile-info-label">{lbl}</div>
            <div className="profile-info-value">{val}</div>
          </div>
        ))}
      </div>

      {atn.notes && (
        <div className="profile-notes">
          <div className="profile-info-label">Protocol Notes</div>
          <p className="profile-notes-text">{atn.notes}</p>
        </div>
      )}

      <div className="status-section">
        <div className="status-section-label">Update Arrival Status</div>
        <div className="status-buttons">
          {STATUSES.map(s => (
            <button key={s.id} onClick={() => onStatus(s.id)}
              className={`status-btn ${atn.status===s.id ? 'active' : ''}`}
              style={{
                borderColor: `${s.color}${atn.status===s.id?'':44}`,
                background: atn.status===s.id ? `${s.color}22` : 'transparent',
                color: s.color
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="profile-modal-actions">
        <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        {canEdit && <button className="btn btn-gold btn-sm" onClick={onEdit}>✏ Edit Profile</button>}
      </div>
    </div>
  </>;
}

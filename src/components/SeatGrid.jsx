import { SECTIONS, DEFAULT_CONFIG, STATUSES, statusColor } from '../lib/constants';

export function SeatGrid({ sectionId, cfg, attendees, canEdit, onSeatClick }) {
  const sec = SECTIONS.find(s => s.id === sectionId);
  // cfg is now a JSONB object like { choir: { rows: 5, cols: 4 }, ... }
  const cfgMap = cfg || {};
  const c   = cfgMap[sectionId] || DEFAULT_CONFIG[sectionId] || { rows:5, cols:5 };
  
  const getAtt = (r, col) => attendees.find(d => d.section === sectionId && d.row_num === r && d.col_num === col);

  return (
    <div className="seat-grid-wrap fade-in">
      <div className="seat-grid-header">
        <div className="seat-grid-legend-dot" style={{ width:12, height:12, borderRadius:3, background:sec?.color }}/>
        <h4 className="seat-grid-title">{sec?.label}</h4>
        <span className="seat-grid-info">{c.rows} rows × {c.cols} cols = {c.rows * c.cols} seats</span>
        <div className="seat-grid-legend">
          {STATUSES.map(s => (
            <div key={s.id} className="seat-grid-legend-item">
              <div className="seat-grid-legend-dot" style={{ background:s.color }}/>{s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="seat-grid-scroll">
        <div className="seat-grid-cols">
          {Array.from({ length:c.cols }, (_, i) => (
            <div key={i} className="seat-grid-col-label">{i+1}</div>
          ))}
        </div>
        {Array.from({ length:c.rows }, (_, r) => (
          <div key={r} className="seat-grid-row">
            <div className="seat-grid-row-label">{r+1}</div>
            {Array.from({ length:c.cols }, (_, col) => {
              const d = getAtt(r+1, col+1);
              return (
                <div key={col}
                  className={`seat ${d ? `occ-${d.status}` : 'empty'}`}
                  onClick={() => onSeatClick(r+1, col+1, d)}
                  title={d ? `${d.name} — ${STATUSES.find(s=>s.id===d.status)?.label}` : `Seat ${r+1}-${col+1} (Empty${canEdit?' • click to assign':''})`}
                  style={{ background: d ? `${statusColor[d.status]}1a` : '#0a1a10',
                    borderColor: d ? `${statusColor[d.status]}55` : '#143d22' }}>
                  {d ? (
                    <span style={{ color:statusColor[d.status], fontSize:8, fontWeight:700 }}>
                      {d.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </span>
                  ) : canEdit ? <span style={{ color:'#143d22', fontSize:16, lineHeight:1 }}>·</span> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="seat-grid-hint">
        {canEdit ? 'Click occupied seat to view profile · Click empty seat to assign a dignitary' : 'Click a seat to view profile'}
      </p>
    </div>
  );
}

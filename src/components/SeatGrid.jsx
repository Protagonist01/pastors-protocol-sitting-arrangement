import { SECTIONS, DEFAULT_CONFIG, STATUSES, statusColor } from '../lib/constants';

export function SeatGrid({ sectionId, cfg, attendees, canEdit, onSeatClick }) {
  const sec = SECTIONS.find(s => s.id === sectionId);
  const cfgMap = (cfg || []).reduce((acc, c) => ({ ...acc, [c.section_id]: c }), {});
  const c   = cfgMap[sectionId] || DEFAULT_CONFIG[sectionId] || { rows:5, cols:5 };
  
  const getAtt = (r, col) => attendees.find(d => d.section_id === sectionId && d.row_num === r && d.col_num === col);

  return (
    <div style={{ background:'#051008', border:'1px solid #143d22', borderRadius:12, padding:20 }} className="fade-in">
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ width:12, height:12, borderRadius:3, background:sec?.color, flexShrink:0 }}/>
        <h4 style={{ fontFamily:"'Cormorant Garamond',serif", color:'#e2f0e6', fontSize:18 }}>{sec?.label}</h4>
        <span style={{ color:'#4f6b56', fontSize:12 }}>{c.rows} rows × {c.cols} cols = {c.rows * c.cols} seats</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:12, flexWrap:'wrap' }}>
          {STATUSES.map(s => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#8cb398' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }}/>{s.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ overflowX:'auto', paddingBottom:4 }}>
        <div style={{ display:'flex', gap:4, marginBottom:4, paddingLeft:26 }}>
          {Array.from({ length:c.cols }, (_, i) => (
            <div key={i} style={{ width:30, textAlign:'center', fontSize:9, color:'#2a4430', fontWeight:600 }}>{i+1}</div>
          ))}
        </div>
        {Array.from({ length:c.rows }, (_, r) => (
          <div key={r} style={{ display:'flex', gap:4, marginBottom:4, alignItems:'center' }}>
            <div style={{ width:22, textAlign:'right', fontSize:9, color:'#2a4430', fontWeight:600, flexShrink:0 }}>{r+1}</div>
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
      <p style={{ marginTop:10, fontSize:10, color:'#2a4430', textAlign:'center' }}>
        {canEdit ? 'Click occupied seat to view profile · Click empty seat to assign an attendee' : 'Click a seat to view profile'}
      </p>
    </div>
  );
}

import { SECTIONS, DEFAULT_CONFIG } from '../lib/constants';

export function VenueMap({ cfg, attendees, activeSec, onSec }) {
  const getCount = id => attendees.filter(d => d.section_id === id).length;
  // Convert config array to map for easy lookup
  const cfgMap = (cfg || []).reduce((acc, c) => ({ ...acc, [c.section_id]: c }), {});
  
  const getTotal = id => {
    const c = cfgMap[id] || DEFAULT_CONFIG[id];
    return (c?.rows || 0) * (c?.cols || 0);
  };

  const Block = ({ id, label, style: ex, hideStats }) => {
    const sec   = SECTIONS.find(s => s.id === id);
    const cnt   = getCount(id); 
    const tot   = getTotal(id);
    const isAct = activeSec === id;
    const isClosed = sec?.closed;
    
    return (
      <div className={`section-block${isAct ? ' active-sec' : ''}${isClosed ? ' closed-sec' : ''}`}
        style={{ background:sec?.color, color:sec?.textColor, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 8, cursor: isClosed ? 'not-allowed' : 'pointer', transition: 'all 0.2s', border: isAct ? '3px solid #c9a84c' : '1px solid rgba(0,0,0,0.15)', ...ex }}
        onClick={() => !isClosed && onSec(id)}
        title={isClosed ? `${label || sec?.label} (Closed)` : `${label || sec?.label} — ${cnt} of ${tot} assigned`}>
        <div style={{ fontWeight: 800, fontSize: 11, lineHeight: 1.3, textTransform: 'uppercase', whiteSpace: 'pre-line' }}>{label || sec?.label}</div>
        {!hideStats && (
          <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4, fontWeight: 700 }}>
            {isClosed ? 'CLOSED' : `${cnt}/${tot}`}
          </div>
        )}
        {isAct && (
          <div style={{ position:'absolute', bottom:-5, left:'50%', transform:'translateX(-50%)',
            width:10, height:10, background:'#c9a84c', borderRadius:'50%', boxShadow:'0 0 6px #c9a84c' }}/>
        )}
      </div>
    );
  };

  const Arrow = ({ dir, label, style }) => {
    const isUp = dir === 'up';
    const isDown = dir === 'down';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#e2f0e6', ...style }}>
        {label && isDown && <span style={{ marginBottom: 4 }}>{label}</span>}
        <span style={{ fontSize: 16, lineHeight: 1 }}>{isUp ? '↑' : '↓'}</span>
        {label && isUp && <span style={{ marginTop: 4 }}>{label}</span>}
      </div>
    );
  };

  return (
    <div style={{ background:'#051008', border:'1px solid #143d22', padding: '30px 20px', overflowX: 'auto', borderRadius: 12 }}>
      <div style={{ minWidth: 850, display: 'flex', flexDirection: 'column', gap: 30, position: 'relative', fontFamily: 'system-ui, sans-serif' }}>
        
        {/* TOP ROW */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingLeft: 60 }}>
          <Block id="choir_top" label="CHOIR" style={{ width: 110, height: 110, borderRadius: 2 }} hideStats />
          
          <div style={{ flex: 1, margin: '0 30px', display: 'flex', flexDirection: 'column' }}>
            <Block id="altar" label="ALTAR" style={{ height: 110, borderRadius: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 40px', color: '#e2f0e6', fontWeight: 'bold', fontSize: 12 }}>
              <span>←--------------</span>
              <span>--------------→</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Block id="vvip" label={"SETMAN\n-\nVVIP / CEC\nSECTION"} style={{ width: 160, height: 110, borderRadius: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10, fontWeight: 900, fontSize: 13, color: '#e2f0e6', lineHeight: 1.1 }}>
              <span>C</span><span>L</span><span>O</span><span>S</span><span>E</span><span>D</span>
            </div>
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          
          <Arrow dir="down" label="PP" style={{ width: 40, marginRight: 20 }} />
          
          <Block id="choir_left" label="CHOIR" style={{ width: 110, height: 110, borderRadius: 2 }} />
          
          <Arrow dir="up" label="CP" style={{ width: 40 }} />
          
          <Block id="left" label="LEFT SECTION" style={{ width: 105, height: 110, borderRadius: 16 }} />
          
          <Arrow dir="up" label="CP" style={{ width: 40 }} />
          
          <Block id="middle" label="MIDDLE SECTION" style={{ width: 105, height: 110, borderRadius: 16 }} />
          
          <Arrow dir="down" label="PP" style={{ width: 40 }} />
          
          <Block id="right" label="RIGHT SECTION" style={{ width: 105, height: 110, borderRadius: 16 }} />
          
          <div style={{ fontSize: 10, fontWeight: 900, color: '#e2f0e6', margin: '0 8px' }}>CLOSED</div>
          
          <Block id="minister" label={"MINISTER\nSECTION"} style={{ flex: 1, minWidth: 140, height: 140, borderRadius: 2 }} />
        </div>

        {/* BOTTOM ROW */}
        <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: 20, paddingTop: 60 }}>
          <div style={{ width: 120, height: 120, background: '#fff', color: '#000', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 11 }}>ENTRANCE</div>
          
          <div style={{ flex: 1.8, background: '#900C3F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12, borderRadius: 2 }}>MEDIA</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 60, color: '#e2f0e6' }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>↑</span>
            <span style={{ fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>ENTRANCE</span>
          </div>

          <div style={{ flex: 1.2, background: '#7D5A85', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 11, textAlign: 'center', padding: 10, borderRadius: 2 }}>ADMIN STAND FOR PUBLICATIONS</div>
          
          <div style={{ width: 120, height: 120, background: '#fff', color: '#000', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 11 }}>ENTRANCE</div>
        </div>

      </div>
    </div>
  );
}

import { SECTIONS, DEFAULT_CONFIG } from '../lib/constants';

export function VenueMap({ cfg, attendees, activeSec, onSec }) {
  // cfg is now a JSONB object like { choir: { rows: 5, cols: 4 }, ... }
  const cfgMap = cfg || {};

  const getCount = id => attendees.filter(d => d.section === id).length;
  
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
        style={{ background:sec?.color, color: isClosed ? '#000' : '#fff', flexDirection:'column', cursor: isClosed ? 'not-allowed' : 'pointer', border: isAct ? '3px solid #c9a84c' : '1px solid rgba(0,0,0,0.15)', ...ex }}
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#e2f0e6', ...style }}>
        {label && !isUp && <span style={{ marginBottom: 4 }}>{label}</span>}
        <span style={{ fontSize: 16, lineHeight: 1 }}>{isUp ? '↑' : '↓'}</span>
        {label && isUp && <span style={{ marginTop: 4 }}>{label}</span>}
      </div>
    );
  };

  return (
    <div className="venue-map">
      <div className="venue-scroll-hint">← Swipe to explore the venue map →</div>
      <div className="venue-map-inner">
        
        {/* TOP ROW */}
        <div className="venue-top-row">
          <Block id="choir" label="CHOIR" style={{ width: 130, height: 110, borderRadius: 2 }} />
          
          <div className="venue-altar-wrapper">
            <Block id="altar" label="ALTAR" style={{ height: 110, borderRadius: 2 }} />
            <div className="venue-altar-arrows">
              <span>←--------------</span>
              <span>--------------→</span>
            </div>
          </div>
          
          <div className="venue-vvip-wrapper">
            <Block id="vvip" label={"SETMAN\n-\nVVIP / CEC\nSECTION"} style={{ width: 160, height: 110, borderRadius: 16 }} />
            <div className="venue-vvip-closed">
              <span>C</span><span>L</span><span>O</span><span>S</span><span>E</span><span>D</span>
            </div>
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div className="venue-mid-row">
          
          <Arrow dir="down" label="PP" style={{ width: 40, marginRight: 20 }} />
          
          <Block id="left" label="LEFT SECTION" style={{ width: 105, height: 110, borderRadius: 16 }} />
          
          <Arrow dir="up" label="CP" style={{ width: 40 }} />
          
          <Block id="middle" label="MIDDLE SECTION" style={{ width: 105, height: 110, borderRadius: 16 }} />
          
          <Arrow dir="down" label="PP" style={{ width: 40 }} />
          
          <Block id="right" label="RIGHT SECTION" style={{ width: 105, height: 110, borderRadius: 16 }} />
          
          <Arrow dir="up" label="CP" style={{ width: 40 }} />
          
          <Block id="minister" label={"MINISTER\nSECTION"} style={{ flex: 1, minWidth: 140, height: 140, borderRadius: 2 }} />
        </div>

        {/* BOTTOM ROW */}
        <div className="venue-bot-row">
          <div className="venue-entrance">ENTRANCE</div>
          
          <div className="venue-media-bar">MEDIA</div>
          
          <div className="venue-entrance-arrow">
            <span style={{ fontSize: 20, lineHeight: 1 }}>↑</span>
            <span style={{ fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>ENTRANCE</span>
          </div>

          <div className="venue-admin-bar">ADMIN STAND FOR PUBLICATIONS</div>
          
          <div className="venue-entrance">ENTRANCE</div>
        </div>

      </div>
    </div>
  );
}

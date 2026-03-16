export const SECTIONS = [
  { id: 'choir_top', label: 'Choir (Top)',            color: '#f5c69d', textColor: '#000', closed: false },
  { id: 'altar',     label: 'Altar',                  color: '#5eac24', textColor: '#fff', closed: true  },
  { id: 'vvip',      label: 'SETMAN / VVIP / CEC',    color: '#d1d5db', textColor: '#000', closed: true  },
  { id: 'choir_left',label: 'Choir (Left)',           color: '#f5c69d', textColor: '#000', closed: false },
  { id: 'left',      label: 'Left Section',           color: '#e02424', textColor: '#fff', closed: false },
  { id: 'middle',    label: 'Middle Section',         color: '#2fa3e6', textColor: '#fff', closed: false },
  { id: 'right',     label: 'Right Section',          color: '#fcf87c', textColor: '#000', closed: true  },
  { id: 'minister',  label: 'Minister Section',       color: '#637381', textColor: '#fff', closed: true  },
];

export const OPEN_SECTIONS = SECTIONS.filter(s => !s.closed);

export const DEFAULT_CONFIG = {
  choir_top: { rows: 4,  cols: 4 },
  choir_left:{ rows: 4,  cols: 4 },
  left:      { rows: 8,  cols: 5 },
  middle:    { rows: 10, cols: 6 },
  right:     { rows: 8,  cols: 5 },
  minister:  { rows: 6,  cols: 5 },
  vvip:      { rows: 3,  cols: 4 },
  altar:     { rows: 2,  cols: 5 },
};

export const STATUSES = [
  { id: 'pending', label: 'Not Arrived', color: '#64748b', bg: '#1e293b'   },
  { id: 'arrived', label: 'Arrived',     color: '#f59e0b', bg: '#451a0344' },
  { id: 'seated',  label: 'Seated',      color: '#22c55e', bg: '#05291644' },
  { id: 'absent',  label: 'Absent',      color: '#ef4444', bg: '#1c050544' },
];

export const statusColor = {
  pending: '#64748b', arrived: '#f59e0b', seated: '#22c55e', absent: '#ef4444',
};

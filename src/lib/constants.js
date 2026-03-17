// Sections — matches AGENT_CONTEXT.md §9 exactly
export const SECTIONS = [
  { id: 'choir',    label: 'Choir',            color: '#e8843a' },
  { id: 'left',     label: 'Left Section',     color: '#c0392b' },
  { id: 'middle',   label: 'Middle Section',   color: '#2471a3' },
  { id: 'right',    label: 'Right Section',    color: '#b8920a' },
  { id: 'minister', label: 'Minister Section', color: '#4a5568' },
  // --- closed (display only, not assignable) ---
  { id: 'vvip',     label: 'SETMAN / VVIP / CEC', closed: true, color: '#d1d5db' },
  { id: 'altar',    label: 'Altar',               closed: true, color: '#5eac24' },
];

export const OPEN_SECTIONS = SECTIONS.filter(s => !s.closed);

// Default grid sizes per AGENT_CONTEXT.md §9
export const DEFAULT_CONFIG = {
  choir:    { rows: 5,  cols: 4 },
  left:     { rows: 8,  cols: 5 },
  middle:   { rows: 10, cols: 6 },
  right:    { rows: 8,  cols: 5 },
  minister: { rows: 6,  cols: 5 },
};

// Status lifecycle — AGENT_CONTEXT.md §10
export const STATUSES = [
  { id: 'pending', label: 'Not Arrived', color: '#64748b', bg: '#1e293b'   },
  { id: 'arrived', label: 'Arrived',     color: '#f59e0b', bg: '#451a0344' },
  { id: 'seated',  label: 'Seated',      color: '#22c55e', bg: '#05291644' },
  { id: 'absent',  label: 'Absent',      color: '#ef4444', bg: '#1c050544' },
];

export const statusColor = {
  pending: '#64748b', arrived: '#f59e0b', seated: '#22c55e', absent: '#ef4444',
};

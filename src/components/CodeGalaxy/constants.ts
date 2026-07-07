// ── CodeGalaxy types & shared constants ──

export type GraphNode = {
  id: string;
  label: string;
  norm_label: string;
  source_file: string;
  source_location: string;
  community: number;
  community_name: string;
  file_type: string;
  degree: number;
};

export type GraphLink = {
  source: string;
  target: string;
  relation: 'contains' | 'imports' | 'imports_from' | 'calls' | 'references' | 'method' | 'indirect_call' | string;
  source_file: string;
  source_location: string;
  weight: number;
};

export type GraphPayload = {
  nodes: GraphNode[];
  links: GraphLink[];
  built_at_commit?: string;
};

// Community palette — assigning a unique glow hue per nebula.
export const COMMUNITY_PALETTE = [
  '#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981',
  '#ec4899', '#3b82f6', '#84cc16', '#a855f7', '#14b8a6',
  '#f97316', '#8b5cf6', '#22c55e', '#eab308', '#0ea5e9',
  '#d946ef', '#fb7185', '#4ade80', '#fbbf24', '#60a5fa',
];

// Edge relation aesthetics
export const RELATION_COLORS: Record<string, string> = {
  contains: '#a78bfa',
  imports: '#60a5fa',
  imports_from: '#38bdf8',
  calls: '#f59e0b',
  references: '#34d399',
  method: '#fb7185',
  indirect_call: '#64748b',
};

export const RELATION_LABELS: Record<string, string> = {
  contains: 'contains',
  imports: 'imports',
  imports_from: 'imports from',
  calls: 'calls',
  references: 'references',
  method: 'method of',
  indirect_call: 'indirect call',
};

// Glow color computed from community palette; opacity multiplied at draw time.
export const nebulaColor = (community: number, alpha = 1) => COMMUNITY_PALETTE[community % COMMUNITY_PALETTE.length] + Math.round(alpha * 255).toString(16).padStart(2, '0');

// Layout & camera
export const HUB_RADIUS = 360;          // distance of community hubs from origin
export const NODE_BASE_RADIUS = 7;     // base px
export const NODE_MAX_RADIUS = 22;     // max px (proportional to degree)
export const DRIFT_AMPLITUDE = 6;      // px
export const DRIFT_SPEED = 0.0003;     // ms scale
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 4;
export const PICK_RADIUS_PX = 18;      // click hit-test radius in screen px
export const FOCUS_RADIUS = 220;       // radius around selection to keep bright
export const EDGE_ALPHA_DIM = 0.12;
export const EDGE_ALPHA_LIT = 0.9;
export const NODE_ALPHA_DIM = 0.25;
export const NODE_ALPHA_LIT = 1.0;

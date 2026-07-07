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

// Community palette — solar system planets + dwarf planets + moons.
// Each community maps to a real celestial body with its actual colors.
export const COMMUNITY_PALETTE = [
  '#b5b5b5', // 0  Mercury — grey cratered
  '#e8cda0', // 1  Venus — pale yellow-orange
  '#4a90d9', // 2  Earth — blue ocean
  '#c1440e', // 3  Mars — rusty red
  '#c88b3a', // 4  Jupiter — amber brown bands
  '#d4a843', // 5  Saturn — golden beige
  '#72b5c4', // 6  Uranus — pale cyan
  '#3b5d9e', // 7  Neptune — deep azure
  '#9a8c7a', // 8  Pluto — tan/brown
  '#e04040', // 9  Ceres — dark reddish
  '#c0c0c0', // 10 Io — sulfurous yellow-grey
  '#d4e0f0', // 11 Europa — icy white-blue
  '#c47030', // 12 Ganymede — brown-grey
  '#f0d0a0', // 13 Titan — orange haze
  '#b0d0e8', // 14 Triton — nitrogen blue
  '#e88070', // 15 Enceladus — warm ice pink
  '#8060a0', // 16 Oberon — dark purple-grey
  '#f0c848', // 17 Phobos — golden rock
  '#5890c0', // 18 Callisto — dark blue-grey
];

// Planet type classifications for visual rendering
export type PlanetType = 'star' | 'gasGiant' | 'terrestrial' | 'icePlanet' | 'dwarf' | 'moon' | 'asteroid';

export const COMMUNITY_PLANET_TYPE: PlanetType[] = [
  'asteroid',  // 0  Mercury
  'terrestrial', // 1  Venus
  'terrestrial', // 2  Earth
  'terrestrial', // 3  Mars
  'gasGiant',   // 4  Jupiter
  'gasGiant',   // 5  Saturn
  'icePlanet',  // 6  Uranus
  'icePlanet',  // 7  Neptune
  'dwarf',      // 8  Pluto
  'dwarf',      // 9  Ceres
  'moon',       // 10 Io
  'moon',       // 11 Europa
  'moon',       // 12 Ganymede
  'moon',       // 13 Titan
  'moon',       // 14 Triton
  'moon',       // 15 Enceladus
  'moon',       // 16 Oberon
  'moon',       // 17 Phobos
  'moon',       // 18 Callisto
];

export const PLANET_NAMES: string[] = [
  'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto', 'Ceres',
  'Io', 'Europa', 'Ganymede', 'Titan', 'Triton', 'Enceladus', 'Oberon', 'Phobos', 'Callisto',
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
export const NODE_BASE_RADIUS = 10;     // base px
export const NODE_MAX_RADIUS = 30;     // max px (proportional to degree)
export const DRIFT_AMPLITUDE = 6;      // px
export const DRIFT_SPEED = 0.0003;     // ms scale
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 12;
export const PICK_RADIUS_PX = 18;      // click hit-test radius in screen px
export const FOCUS_RADIUS = 220;       // radius around selection to keep bright
export const EDGE_ALPHA_DIM = 0.12;
export const EDGE_ALPHA_LIT = 0.9;
export const NODE_ALPHA_DIM = 0.25;
export const NODE_ALPHA_LIT = 1.0;

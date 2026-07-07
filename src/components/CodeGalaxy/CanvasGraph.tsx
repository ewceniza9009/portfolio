import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { LayoutNode, LayoutState, Camera } from './useGraphLayout';
import type { GraphNode, GraphLink } from './constants';
import {
  COMMUNITY_PALETTE,
  COMMUNITY_PLANET_TYPE,
  RELATION_COLORS,
  NODE_BASE_RADIUS,
  NODE_MAX_RADIUS,
  DRIFT_AMPLITUDE,
  DRIFT_SPEED,
  MIN_ZOOM,
  MAX_ZOOM,
  PICK_RADIUS_PX,
  EDGE_ALPHA_DIM,
  EDGE_ALPHA_LIT,
  NODE_ALPHA_DIM,
  NODE_ALPHA_LIT,
} from './constants';
import type { PlanetType } from './constants';

interface CanvasGraphProps {
  layout: LayoutState;
  layoutRef: React.MutableRefObject<LayoutState>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  visibleNodes: Set<string>;
  visibleLinks: GraphLink[];
  tooltip: { x: number; y: number; node: GraphNode } | null;
  onTooltip: (t: { x: number; y: number; node: GraphNode } | null) => void;
}

// Precomputed lookup for node → index in layout.nodes
function buildIndexMap(nodes: LayoutNode[]): Map<string, number> {
  const map = new Map<string, number>();
  nodes.forEach((n, i) => map.set(n.id, i));
  return map;
}

export function CanvasGraph({
  layout,
  layoutRef,
  selectedId,
  onSelect,
  hoveredId,
  onHover,
  visibleNodes,
  visibleLinks,
  tooltip,
  onTooltip,
}: CanvasGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 1, vx: 0, vy: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0, spaceHeld: false });
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Index map for O(1) node lookup by id
  const indexMap = useMemo(() => buildIndexMap(layout.nodes), [layout]);

  // Shared refs for animation loop (no re-render needed)
  const selectedRef = useRef(selectedId);
  const hoveredRef = useRef(hoveredId);
  const visibleNodesRef = useRef(visibleNodes);
  const visibleLinksRef = useRef(visibleLinks);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { hoveredRef.current = hoveredId; }, [hoveredId]);
  useEffect(() => { visibleNodesRef.current = visibleNodes; }, [visibleNodes]);
  useEffect(() => { visibleLinksRef.current = visibleLinks; }, [visibleLinks]);

  // ── World-space helpers ──
  const screenToWorld = useCallback((sx: number, sy: number, cam: Camera, w: number, h: number) => ({
    x: (sx - w / 2) / cam.zoom + cam.x,
    y: (sy - h / 2) / cam.zoom + cam.y,
  }), []);

  // ── Hit test ──
  const hitTest = useCallback((sx: number, sy: number, cam: Camera, w: number, h: number): LayoutNode | null => {
    const nodes = layoutRef.current.nodes;
    const vis = visibleNodesRef.current;
    const wp = screenToWorld(sx, sy, cam, w, h);
    const pickR = PICK_RADIUS_PX / cam.zoom;
    let best: LayoutNode | null = null;
    let bestDist = Infinity;
    for (const n of nodes) {
      if (!vis.has(n.id)) continue;
      const dx = n.x - wp.x;
      const dy = n.y - wp.y;
      const d = dx * dx + dy * dy;
      if (d < bestDist && d < pickR * pickR) {
        bestDist = d;
        best = n;
      }
    }
    return best;
  }, [layoutRef, screenToWorld]);

  // ── Main render loop ──
  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = lastTimeRef.current ? time - lastTimeRef.current : 16;
    lastTimeRef.current = time;

    const cam = cameraRef.current;
    const { nodes } = layoutRef.current;
    const vis = visibleNodesRef.current;
    const visLinks = visibleLinksRef.current;
    const sel = selectedRef.current;
    const hov = hoveredRef.current;

    // Camera momentum
    cam.x += cam.vx * dt * 0.001;
    cam.y += cam.vy * dt * 0.001;
    cam.vx *= 0.96;
    cam.vy *= 0.96;
    if (Math.abs(cam.vx) < 0.01) cam.vx = 0;
    if (Math.abs(cam.vy) < 0.01) cam.vy = 0;

    const w = canvas.width;
    const h = canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const now = time;

    // Background
    ctx.fillStyle = '#060612';
    ctx.fillRect(0, 0, w, h);

    // ── Galaxy spiral arms (background, very slow rotation) ──
    ctx.save();
    const galaxyCx = w / 2;
    const galaxyCy = h / 2;
    const galaxyR = Math.min(w, h) * 0.45;
    const spiralAngle = now * 0.000015;
    for (let arm = 0; arm < 3; arm++) {
      const armOffset = (arm / 3) * Math.PI * 2;
      ctx.beginPath();
      for (let s = 0; s < 200; s++) {
        const t = s / 200;
        const r = t * galaxyR;
        const a = armOffset + spiralAngle + t * Math.PI * 2.5;
        const x = galaxyCx + Math.cos(a) * r;
        const y = galaxyCy + Math.sin(a) * r;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(120,100,180,${0.04})`;
      ctx.lineWidth = 2 + Math.sin(now * 0.0003 + arm) * 0.5;
      ctx.stroke();
    }
    // Galaxy core glow
    const gCore = ctx.createRadialGradient(galaxyCx, galaxyCy, 0, galaxyCx, galaxyCy, galaxyR * 0.25);
    gCore.addColorStop(0, 'rgba(180,160,255,0.06)');
    gCore.addColorStop(0.5, 'rgba(120,100,200,0.02)');
    gCore.addColorStop(1, 'rgba(80,60,150,0)');
    ctx.fillStyle = gCore;
    ctx.beginPath();
    ctx.arc(galaxyCx, galaxyCy, galaxyR * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Cosmological dust clouds (pre-seeded, subtle) ──
    ctx.save();
    const dustSeed2 = 777;
    for (let i = 0; i < 18; i++) {
      const dx = ((dustSeed2 * (i + 1) * 4219) % 10000) / 10000 * w;
      const dy = ((dustSeed2 * (i + 1) * 3571) % 10000) / 10000 * h;
      const dr = 60 + ((i * 137) % 120);
      const drift = Math.sin(now * 0.00008 + i * 0.9) * 15;
      const colors = [
        `rgba(100,60,140,${0.025})`,
        `rgba(60,100,160,${0.02})`,
        `rgba(140,80,60,${0.018})`,
        `rgba(60,140,120,${0.02})`,
      ];
      const cloudGrad = ctx.createRadialGradient(dx + drift, dy, 0, dx + drift, dy, dr);
      cloudGrad.addColorStop(0, colors[i % colors.length]);
      cloudGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.ellipse(dx + drift, dy, dr, dr * 0.6, i * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── Shooting stars / meteors (spawn every ~3s, last ~1s) ──
    const meteorCycle = 3000;
    const meteorLife = 800;
    const meteorPhase = (now % meteorCycle);
    if (meteorPhase < meteorLife) {
      const t = meteorPhase / meteorLife;
      const mSeed = Math.floor(now / meteorCycle);
      const startX = ((mSeed * 9973) % 10000) / 10000 * w * 0.8 + w * 0.1;
      const startY = ((mSeed * 7727) % 10000) / 10000 * h * 0.5;
      const angle = 0.6 + (mSeed % 5) * 0.15;
      const speed = 350 + (mSeed % 3) * 100;
      const mx = startX + Math.cos(angle) * speed * t;
      const my = startY + Math.sin(angle) * speed * t;
      const mTail = 50 + (mSeed % 3) * 20;
      const mAlpha = t < 0.5 ? t * 2 : (1 - t) * 2;
      // Tail
      const mGrad = ctx.createLinearGradient(
        mx - Math.cos(angle) * mTail, my - Math.sin(angle) * mTail,
        mx, my
      );
      mGrad.addColorStop(0, `rgba(200,220,255,0)`);
      mGrad.addColorStop(0.6, `rgba(200,220,255,${0.15 * mAlpha})`);
      mGrad.addColorStop(1, `rgba(255,255,255,${0.6 * mAlpha})`);
      ctx.beginPath();
      ctx.moveTo(mx - Math.cos(angle) * mTail, my - Math.sin(angle) * mTail);
      ctx.lineTo(mx + Math.cos(angle + Math.PI / 2) * 1.5, my + Math.sin(angle + Math.PI / 2) * 1.5);
      ctx.lineTo(mx, my);
      ctx.lineTo(mx + Math.cos(angle - Math.PI / 2) * 1.5, my + Math.sin(angle - Math.PI / 2) * 1.5);
      ctx.closePath();
      ctx.fillStyle = mGrad;
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.8 * mAlpha})`;
      ctx.fill();
    }

    // ── Static starfield ──
    ctx.save();
    const starSeed = 42;
    for (let i = 0; i < 180; i++) {
      const sx = ((starSeed * (i + 1) * 7919) % 10000) / 10000 * w;
      const sy = ((starSeed * (i + 1) * 6271) % 10000) / 10000 * h;
      const twinkle = 0.3 + 0.4 * Math.sin(now * 0.001 + i * 2.3);
      const size = 0.4 + ((i % 4) * 0.25);
      // Color variation
      const starColors = ['200,210,255', '255,220,180', '180,200,255', '255,200,160'];
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${starColors[i % starColors.length]},${twinkle})`;
      ctx.fill();
    }
    ctx.restore();

    // ── Floating dust motes (tiny, drifting) ──
    ctx.save();
    for (let i = 0; i < 40; i++) {
      const baseX = ((i * 6151 + 3331) % 10000) / 10000 * w;
      const baseY = ((i * 4483 + 1999) % 10000) / 10000 * h;
      const driftX2 = Math.sin(now * 0.00012 + i * 1.1) * 30;
      const driftY2 = Math.cos(now * 0.00009 + i * 0.7) * 20;
      const px = baseX + driftX2;
      const py = baseY + driftY2;
      const moteAlpha = 0.15 + 0.1 * Math.sin(now * 0.0015 + i);
      ctx.beginPath();
      ctx.arc(px, py, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,180,220,${moteAlpha})`;
      ctx.fill();
    }
    ctx.restore();

    // ── Helper: draw community nebula glow ──
    const drawNebula = (cx: number, cy: number, community: number, radius: number, alpha: number) => {
      const col = COMMUNITY_PALETTE[community % COMMUNITY_PALETTE.length];
      const sx = (cx - cam.x) * cam.zoom + w / 2;
      const sy = (cy - cam.y) * cam.zoom + h / 2;
      const r = radius * cam.zoom;
      if (!isFinite(sx) || !isFinite(sy) || !isFinite(r) || r < 1) return;

      const r0 = parseInt(col.slice(1, 3), 16);
      const g0 = parseInt(col.slice(3, 5), 16);
      const b0 = parseInt(col.slice(5, 7), 16);
      const hex = (rr: number, gg: number, bb: number, a: number) =>
        '#' + Math.round(rr).toString(16).padStart(2, '0') +
               Math.round(gg).toString(16).padStart(2, '0') +
               Math.round(bb).toString(16).padStart(2, '0') +
               Math.round(a * 255).toString(16).padStart(2, '0');

      // Outer soft nebula
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      grad.addColorStop(0, hex(r0, g0, b0, 0.18 * alpha));
      grad.addColorStop(0.3, hex(r0, g0, b0, 0.08 * alpha));
      grad.addColorStop(0.7, hex(r0 * 0.5, g0 * 0.5, b0 * 0.5, 0.03 * alpha));
      grad.addColorStop(1, hex(r0, g0, b0, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Inner brighter core
      const coreR = r * 0.35;
      const coreGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, coreR);
      coreGrad.addColorStop(0, hex(r0, g0, b0, 0.12 * alpha));
      coreGrad.addColorStop(1, hex(r0, g0, b0, 0));
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, coreR, 0, Math.PI * 2);
      ctx.fill();
    };

    // ── Community hubs: compute approximate centroids ──
    const communityCentroids = new Map<number, { x: number; y: number; count: number }>();
    for (const n of nodes) {
      if (!vis.has(n.id)) continue;
      if (!communityCentroids.has(n.community)) communityCentroids.set(n.community, { x: 0, y: 0, count: 0 });
      const c = communityCentroids.get(n.community)!;
      c.x += n.x;
      c.y += n.y;
      c.count++;
    }
    for (const [cid, c] of communityCentroids) {
      c.x /= c.count;
      c.y /= c.count;
      const avgR = 60 + Math.sqrt(c.count) * 22;
      const alpha = sel && nodes.find(n => n.id === sel && n.community === cid) ? 1.0 : 0.6;
      drawNebula(c.x, c.y, cid, avgR, alpha);
    }

    // ── Draw edges ──
    ctx.lineWidth = 1;
    const timeNow = time;
    for (const link of visLinks) {
      const si = indexMap.get(link.source);
      const ti = indexMap.get(link.target);
      if (si === undefined || ti === undefined) continue;
      const s = nodes[si];
      const t = nodes[ti];
      if (!vis.has(s.id) || !vis.has(t.id)) continue;

      let alpha = EDGE_ALPHA_DIM;
      const isHighlighted =
        (sel && (link.source === sel || link.target === sel)) ||
        (hov && (link.source === hov || link.target === hov));
      if (isHighlighted) alpha = EDGE_ALPHA_LIT;

      const relColor = RELATION_COLORS[link.relation] || '#666';
      const sx2 = (s.x - cam.x) * cam.zoom + w / 2;
      const sy2 = (s.y - cam.y) * cam.zoom + h / 2;
      const tx2 = (t.x - cam.x) * cam.zoom + w / 2;
      const ty2 = (t.y - cam.y) * cam.zoom + h / 2;

      if (!isFinite(sx2) || !isFinite(sy2) || !isFinite(tx2) || !isFinite(ty2)) continue;

      // Gradient along the line
      const grad = ctx.createLinearGradient(sx2, sy2, tx2, ty2);
      grad.addColorStop(0, relColor + Math.round(alpha * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(1, relColor + Math.round(alpha * 0.6 * 255).toString(16).padStart(2, '0'));
      ctx.strokeStyle = grad;

      // Animated dash for highlighted edges
      if (isHighlighted) {
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -timeNow * 0.03;
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(sx2, sy2);
      ctx.lineTo(tx2, ty2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ── Draw nodes ──
    for (const n of nodes) {
      if (!vis.has(n.id)) continue;

      const isSel = n.id === sel;
      const isHov = n.id === hov;
      const isNeighbor = sel != null && visLinks.some(l => (l.source === sel && l.target === n.id) || (l.target === sel && l.source === n.id));

      let alpha = NODE_ALPHA_DIM;
      if (sel && (isSel || isNeighbor)) alpha = NODE_ALPHA_LIT;
      else if (!sel) alpha = isHov ? NODE_ALPHA_LIT : 0.7;

      const col = COMMUNITY_PALETTE[n.community % COMMUNITY_PALETTE.length];
      const baseR = Math.min(NODE_BASE_RADIUS + n.degree * 1.4, NODE_MAX_RADIUS);
      const radius = baseR * Math.min(cam.zoom, 2);

      // Drift
      const driftX = Math.cos(n.driftPhase + now * DRIFT_SPEED) * DRIFT_AMPLITUDE;
      const driftY = Math.sin(n.driftPhase + now * DRIFT_SPEED * 1.3 + 1) * DRIFT_AMPLITUDE;

      const sx2 = (n.x + driftX - cam.x) * cam.zoom + w / 2;
      const sy2 = (n.y + driftY - cam.y) * cam.zoom + h / 2;

      if (!isFinite(sx2) || !isFinite(sy2) || !isFinite(radius) || radius < 0.3) continue;

      const hex = (r: number, g: number, b: number, a: number) =>
        '#' + Math.round(Math.max(0, Math.min(255, r))).toString(16).padStart(2, '0') +
               Math.round(Math.max(0, Math.min(255, g))).toString(16).padStart(2, '0') +
               Math.round(Math.max(0, Math.min(255, b))).toString(16).padStart(2, '0') +
               Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');

      const r0 = parseInt(col.slice(1, 3), 16);
      const g0 = parseInt(col.slice(3, 5), 16);
      const b0 = parseInt(col.slice(5, 7), 16);
      const clamp = (v: number) => Math.max(0, Math.min(255, v));
      const degree = n.degree;

      // Classify by community planet type, fallback to degree
      const planetType: PlanetType = COMMUNITY_PLANET_TYPE[n.community] || (degree >= 8 ? 'star' : degree >= 5 ? 'gasGiant' : degree >= 3 ? 'terrestrial' : degree >= 1 ? 'icePlanet' : 'asteroid');

      // ═══════════════════════════════════════════
      // STAR — Sun-like
      // ═══════════════════════════════════════════
      if (planetType === 'star' || degree >= 8) {
        // Corona
        const coronaR = radius * 4;
        const corona = ctx.createRadialGradient(sx2, sy2, radius * 0.5, sx2, sy2, coronaR);
        corona.addColorStop(0, hex(255, 220, 100, 0.25 * alpha));
        corona.addColorStop(0.3, hex(255, 180, 50, 0.08 * alpha));
        corona.addColorStop(0.7, hex(255, 140, 30, 0.02 * alpha));
        corona.addColorStop(1, hex(255, 100, 20, 0));
        ctx.fillStyle = corona;
        ctx.beginPath();
        ctx.arc(sx2, sy2, coronaR, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing glow
        const pulse = 1 + Math.sin(now * 0.002) * 0.15;
        const pulseR = radius * 3 * pulse;
        const pulseGrad = ctx.createRadialGradient(sx2, sy2, radius * 0.3, sx2, sy2, pulseR);
        pulseGrad.addColorStop(0, hex(255, 240, 180, 0.3 * alpha));
        pulseGrad.addColorStop(0.5, hex(255, 200, 80, 0.06 * alpha));
        pulseGrad.addColorStop(1, hex(255, 160, 40, 0));
        ctx.fillStyle = pulseGrad;
        ctx.beginPath();
        ctx.arc(sx2, sy2, pulseR, 0, Math.PI * 2);
        ctx.fill();

        // Solar flare rays
        ctx.save();
        ctx.translate(sx2, sy2);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + now * 0.0003;
          const flareLen = radius * (2.2 + Math.sin(now * 0.001 + i * 1.7) * 0.8);
          const flareGrad = ctx.createLinearGradient(0, 0, Math.cos(angle) * flareLen, Math.sin(angle) * flareLen);
          flareGrad.addColorStop(0, hex(255, 230, 150, 0.35 * alpha));
          flareGrad.addColorStop(0.4, hex(255, 200, 80, 0.1 * alpha));
          flareGrad.addColorStop(1, hex(255, 160, 40, 0));
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle - 0.15) * flareLen * 0.4, Math.sin(angle - 0.15) * flareLen * 0.4);
          ctx.lineTo(Math.cos(angle) * flareLen, Math.sin(angle) * flareLen);
          ctx.lineTo(Math.cos(angle + 0.15) * flareLen * 0.4, Math.sin(angle + 0.15) * flareLen * 0.4);
          ctx.closePath();
          ctx.fillStyle = flareGrad;
          ctx.fill();
        }
        ctx.restore();

        // Body — blazing white-yellow
        const body = ctx.createRadialGradient(sx2 - radius * 0.3, sy2 - radius * 0.3, 0, sx2, sy2, radius);
        body.addColorStop(0, hex(255, 255, 240, alpha));
        body.addColorStop(0.2, hex(255, 240, 160, alpha));
        body.addColorStop(0.5, hex(255, 200, 80, alpha));
        body.addColorStop(0.8, hex(255, 140, 30, alpha));
        body.addColorStop(1, hex(200, 80, 10, alpha));
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
        ctx.fillStyle = body;
        ctx.fill();

        // Hot core
        const core = ctx.createRadialGradient(sx2 - radius * 0.2, sy2 - radius * 0.2, 0, sx2, sy2, radius * 0.5);
        core.addColorStop(0, hex(255, 255, 255, 0.7 * alpha));
        core.addColorStop(1, hex(255, 255, 200, 0));
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      }

      // ═══════════════════════════════════════════
      // GAS GIANT — Jupiter/Saturn
      // ═══════════════════════════════════════════
      else if (planetType === 'gasGiant' || degree >= 5) {
        // Atmosphere
        const atm = ctx.createRadialGradient(sx2, sy2, radius * 0.85, sx2, sy2, radius * 2.2);
        atm.addColorStop(0, hex(r0, g0, b0, 0.15 * alpha));
        atm.addColorStop(0.5, hex(r0, g0, b0, 0.04 * alpha));
        atm.addColorStop(1, hex(r0, g0, b0, 0));
        ctx.fillStyle = atm;
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        const shad = ctx.createRadialGradient(sx2 + radius * 0.2, sy2 + radius * 0.2, 0, sx2 + radius * 0.2, sy2 + radius * 0.2, radius * 1.1);
        shad.addColorStop(0, 'rgba(0,0,0,0.3)');
        shad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shad;
        ctx.beginPath();
        ctx.arc(sx2 + radius * 0.2, sy2 + radius * 0.2, radius * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Body base
        const body = ctx.createRadialGradient(sx2 - radius * 0.35, sy2 - radius * 0.35, 0, sx2, sy2, radius);
        body.addColorStop(0, hex(clamp(r0 + 100), clamp(g0 + 100), clamp(b0 + 100), alpha));
        body.addColorStop(0.4, hex(r0, g0, b0, alpha));
        body.addColorStop(0.8, hex(r0 * 0.5, g0 * 0.5, b0 * 0.5, alpha));
        body.addColorStop(1, hex(r0 * 0.2, g0 * 0.2, b0 * 0.2, alpha));
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
        ctx.fillStyle = body;
        ctx.fill();

        // Horizontal bands (Jupiter stripes)
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
        ctx.clip();
        for (let b = -3; b <= 3; b++) {
          const bandY = sy2 + b * radius * 0.28;
          const bandH = radius * 0.12;
          const bandAlpha = 0.12 + Math.abs(b) * 0.03;
          const bandCol = b % 2 === 0
            ? hex(clamp(r0 + 60), clamp(g0 + 40), clamp(b0 - 20), bandAlpha * alpha)
            : hex(clamp(r0 - 40), clamp(g0 - 20), clamp(b0 + 30), bandAlpha * alpha);
          ctx.fillStyle = bandCol;
          ctx.fillRect(sx2 - radius, bandY, radius * 2, bandH);
        }
        // Great red spot hint (for the biggest gas giants)
        if (degree >= 6) {
          const spotX = sx2 + radius * 0.3;
          const spotY = sy2 + radius * 0.15;
          const spotR = radius * 0.18;
          const spot = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotR);
          spot.addColorStop(0, hex(200, 80, 40, 0.4 * alpha));
          spot.addColorStop(0.7, hex(180, 60, 30, 0.2 * alpha));
          spot.addColorStop(1, hex(160, 40, 20, 0));
          ctx.fillStyle = spot;
          ctx.beginPath();
          ctx.ellipse(spotX, spotY, spotR, spotR * 0.6, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Saturn-style ring (degree >= 6)
        if (degree >= 6) {
          ctx.save();
          ctx.translate(sx2, sy2);
          ctx.rotate(-0.35);
          const ringOuter = radius * 2;
          const ringInner = radius * 1.35;
          // Ring shadow on planet
          ctx.beginPath();
          ctx.ellipse(0, 0, ringOuter, ringOuter * 0.22, 0, 0, Math.PI * 2);
          ctx.strokeStyle = hex(r0, g0, b0, 0.15 * alpha);
          ctx.lineWidth = (ringOuter - ringInner) * 0.7;
          ctx.stroke();
          // Bright ring
          ctx.beginPath();
          ctx.ellipse(0, 0, ringOuter, ringOuter * 0.22, 0, Math.PI * 0.05, Math.PI * 0.95);
          ctx.strokeStyle = hex(clamp(r0 + 60), clamp(g0 + 60), clamp(b0 + 60), 0.3 * alpha);
          ctx.lineWidth = (ringOuter - ringInner) * 0.4;
          ctx.stroke();
          // Inner ring gap
          ctx.beginPath();
          ctx.ellipse(0, 0, ringInner * 1.05, ringInner * 1.05 * 0.22, 0, 0, Math.PI * 2);
          ctx.strokeStyle = hex(255, 255, 255, 0.08 * alpha);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }

        // Specular
        const spec = ctx.createRadialGradient(sx2 - radius * 0.3, sy2 - radius * 0.3, 0, sx2 - radius * 0.3, sy2 - radius * 0.3, radius * 0.4);
        spec.addColorStop(0, hex(255, 255, 255, 0.4 * alpha));
        spec.addColorStop(1, hex(255, 255, 255, 0));
        ctx.beginPath();
        ctx.arc(sx2 - radius * 0.3, sy2 - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = spec;
        ctx.fill();
      }

      // ═══════════════════════════════════════════
      // TERRESTRIAL — Earth-like
      // ═══════════════════════════════════════════
      else if (planetType === 'terrestrial' || degree >= 3) {
        // Atmosphere halo
        const atm = ctx.createRadialGradient(sx2, sy2, radius * 0.9, sx2, sy2, radius * 1.8);
        atm.addColorStop(0, hex(100, 160, 255, 0.12 * alpha));
        atm.addColorStop(0.6, hex(80, 140, 255, 0.03 * alpha));
        atm.addColorStop(1, hex(60, 120, 255, 0));
        ctx.fillStyle = atm;
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        const shad = ctx.createRadialGradient(sx2 + radius * 0.25, sy2 + radius * 0.2, 0, sx2 + radius * 0.25, sy2 + radius * 0.2, radius);
        shad.addColorStop(0, 'rgba(0,0,0,0.4)');
        shad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shad;
        ctx.beginPath();
        ctx.arc(sx2 + radius * 0.25, sy2 + radius * 0.2, radius, 0, Math.PI * 2);
        ctx.fill();

        // Ocean base
        const ocean = ctx.createRadialGradient(sx2 - radius * 0.3, sy2 - radius * 0.3, 0, sx2, sy2, radius);
        ocean.addColorStop(0, hex(80, 140, 220, alpha));
        ocean.addColorStop(0.5, hex(40, 90, 180, alpha));
        ocean.addColorStop(1, hex(20, 50, 120, alpha));
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
        ctx.fillStyle = ocean;
        ctx.fill();

        // Land masses (continent hints)
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
        ctx.clip();
        const seed = n.id.charCodeAt(0) + n.id.charCodeAt(Math.min(1, n.id.length - 1)) * 7;
        for (let c = 0; c < 4; c++) {
          const cx = sx2 + Math.cos(seed + c * 2.1) * radius * 0.4;
          const cy = sy2 + Math.sin(seed + c * 1.7) * radius * 0.35;
          const cr = radius * (0.2 + (c % 3) * 0.1);
          const land = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
          land.addColorStop(0, hex(60, 150, 60, 0.45 * alpha));
          land.addColorStop(0.5, hex(40, 130, 50, 0.2 * alpha));
          land.addColorStop(1, hex(30, 100, 40, 0));
          ctx.fillStyle = land;
          ctx.beginPath();
          ctx.ellipse(cx, cy, cr, cr * 0.7, seed * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Polar ice caps
        ctx.fillStyle = hex(220, 230, 255, 0.25 * alpha);
        ctx.fillRect(sx2 - radius, sy2 - radius, radius * 2, radius * 0.25);
        ctx.fillRect(sx2 - radius, sy2 + radius * 0.75, radius * 2, radius * 0.25);
        ctx.restore();

        // Cloud wisps
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
        ctx.clip();
        for (let cl = 0; cl < 3; cl++) {
          const clx = sx2 + Math.cos(now * 0.0001 + cl * 2.5) * radius * 0.5;
          const cly = sy2 + Math.sin(now * 0.0001 + cl * 3.1) * radius * 0.3;
          const clr = radius * 0.35;
          const cloud = ctx.createRadialGradient(clx, cly, 0, clx, cly, clr);
          cloud.addColorStop(0, hex(255, 255, 255, 0.15 * alpha));
          cloud.addColorStop(1, hex(255, 255, 255, 0));
          ctx.fillStyle = cloud;
          ctx.beginPath();
          ctx.ellipse(clx, cly, clr, clr * 0.4, cl * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Atmosphere rim
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = hex(120, 180, 255, 0.2 * alpha);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ═══════════════════════════════════════════
      // ICE PLANET
      // ═══════════════════════════════════════════
      else if (planetType === 'icePlanet' || planetType === 'dwarf' || degree >= 1) {
        // Frost glow
        const frost = ctx.createRadialGradient(sx2, sy2, radius * 0.7, sx2, sy2, radius * 2);
        frost.addColorStop(0, hex(160, 200, 255, 0.1 * alpha));
        frost.addColorStop(1, hex(120, 180, 255, 0));
        ctx.fillStyle = frost;
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const body = ctx.createRadialGradient(sx2 - radius * 0.3, sy2 - radius * 0.3, 0, sx2, sy2, radius);
        body.addColorStop(0, hex(220, 235, 255, alpha));
        body.addColorStop(0.3, hex(160, 195, 240, alpha));
        body.addColorStop(0.7, hex(100, 140, 200, alpha));
        body.addColorStop(1, hex(50, 80, 150, alpha));
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
        ctx.fillStyle = body;
        ctx.fill();

        // Ice cracks
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = hex(200, 220, 255, 0.2 * alpha);
        ctx.lineWidth = 0.8;
        const iceSeed = n.id.charCodeAt(0) + n.id.charCodeAt(Math.min(1, n.id.length - 1)) * 3;
        for (let cr = 0; cr < 3; cr++) {
          const a1 = (iceSeed + cr) * 1.3;
          ctx.beginPath();
          ctx.moveTo(sx2 + Math.cos(a1) * radius * 0.2, sy2 + Math.sin(a1) * radius * 0.2);
          ctx.lineTo(sx2 + Math.cos(a1 + 0.5) * radius * 0.8, sy2 + Math.sin(a1 + 0.5) * radius * 0.8);
          ctx.stroke();
        }
        ctx.restore();

        // Specular
        const spec = ctx.createRadialGradient(sx2 - radius * 0.25, sy2 - radius * 0.25, 0, sx2 - radius * 0.25, sy2 - radius * 0.25, radius * 0.35);
        spec.addColorStop(0, hex(255, 255, 255, 0.5 * alpha));
        spec.addColorStop(1, hex(255, 255, 255, 0));
        ctx.beginPath();
        ctx.arc(sx2 - radius * 0.25, sy2 - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = spec;
        ctx.fill();
      }

      // ═══════════════════════════════════════════
      // MOON / ASTEROID — small rocky body
      // ═══════════════════════════════════════════
      else {
        // Tiny rocky body
        const body = ctx.createRadialGradient(sx2 - radius * 0.2, sy2 - radius * 0.2, 0, sx2, sy2, radius);
        body.addColorStop(0, hex(160, 150, 140, alpha));
        body.addColorStop(0.5, hex(100, 90, 80, alpha));
        body.addColorStop(1, hex(50, 45, 40, alpha));
        // Irregular shape
        ctx.beginPath();
        const sides = 6 + (n.id.length % 3);
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const vary = 0.7 + ((n.id.charCodeAt(s % n.id.length) % 10) / 10) * 0.5;
          const px = sx2 + Math.cos(a) * radius * vary;
          const py = sy2 + Math.sin(a) * radius * vary;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = body;
        ctx.fill();
        ctx.strokeStyle = hex(80, 70, 60, 0.3 * alpha);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ═══════════════════════════════════════════
      // COMET TAIL (selected / hovered nodes)
      // ═══════════════════════════════════════════
      if (isSel || isHov) {
        const tailLen = radius * 6;
        const angle = Math.atan2(driftY, driftX) + Math.PI; // opposite to drift
        ctx.save();
        ctx.translate(sx2, sy2);
        // Main tail
        const tailGrad = ctx.createLinearGradient(0, 0, Math.cos(angle) * tailLen, Math.sin(angle) * tailLen);
        tailGrad.addColorStop(0, hex(r0, g0, b0, 0.3 * alpha));
        tailGrad.addColorStop(0.3, hex(r0, g0, b0, 0.1 * alpha));
        tailGrad.addColorStop(1, hex(r0, g0, b0, 0));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle - 0.12) * tailLen, Math.sin(angle - 0.12) * tailLen);
        ctx.lineTo(Math.cos(angle + 0.12) * tailLen, Math.sin(angle + 0.12) * tailLen);
        ctx.closePath();
        ctx.fillStyle = tailGrad;
        ctx.fill();
        // Ion tail (thinner, brighter)
        const ionGrad = ctx.createLinearGradient(0, 0, Math.cos(angle) * tailLen * 1.3, Math.sin(angle) * tailLen * 1.3);
        ionGrad.addColorStop(0, hex(200, 220, 255, 0.25 * alpha));
        ionGrad.addColorStop(0.2, hex(150, 180, 255, 0.08 * alpha));
        ionGrad.addColorStop(1, hex(100, 140, 255, 0));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle - 0.04) * tailLen * 1.3, Math.sin(angle - 0.04) * tailLen * 1.3);
        ctx.lineTo(Math.cos(angle + 0.04) * tailLen * 1.3, Math.sin(angle + 0.04) * tailLen * 1.3);
        ctx.closePath();
        ctx.fillStyle = ionGrad;
        ctx.fill();
        ctx.restore();

        // Coma glow
        const coma = ctx.createRadialGradient(sx2, sy2, radius * 0.5, sx2, sy2, radius * 2.5);
        coma.addColorStop(0, hex(200, 220, 255, 0.2 * alpha));
        coma.addColorStop(1, hex(200, 220, 255, 0));
        ctx.fillStyle = coma;
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ═══════════════════════════════════════════
      // SELECTION RING
      // ═══════════════════════════════════════════
      if (isSel) {
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = hex(255, 255, 255, 0.5);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = -now * 0.02;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ═══════════════════════════════════════════
      // LABEL
      // ═══════════════════════════════════════════
      if (cam.zoom >= 0.35 && (isSel || isHov || isNeighbor || n.degree > 4)) {
        const fontSize = Math.max(11, 14 / cam.zoom);
        ctx.font = `${isSel ? 'bold ' : ''}${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const labelAlpha = isSel ? 1 : isHov ? 0.95 : 0.6;
        const textW = ctx.measureText(n.label).width;
        const pillW = textW + 12;
        const pillH = fontSize + 8;
        const pillX = sx2 - pillW / 2;
        const pillY = sy2 + radius + 6;
        // Pill background
        ctx.fillStyle = `rgba(6,6,20,${0.75 * labelAlpha})`;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 5);
        ctx.fill();
        // Pill border
        ctx.strokeStyle = hex(r0, g0, b0, 0.2 * labelAlpha);
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Text
        ctx.fillStyle = hex(255, 255, 255, labelAlpha);
        ctx.fillText(n.label, sx2, pillY + 4);
      }
    }

    animRef.current = requestAnimationFrame(render);
  }, [layoutRef, indexMap]);

  // ── Start animation loop ──
  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  // ── Resize observer ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();

    const obs = new ResizeObserver(resize);
    obs.observe(parent);
    return () => obs.disconnect();
  }, []);

  // ── Mouse handlers ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      dragRef.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        camStartX: cameraRef.current.x,
        camStartY: cameraRef.current.y,
        spaceHeld: dragRef.current.spaceHeld,
      };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const cam = cameraRef.current;

    if (dragRef.current.dragging) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      cam.x = dragRef.current.camStartX - dx / cam.zoom;
      cam.y = dragRef.current.camStartY - dy / cam.zoom;
      cam.vx = 0;
      cam.vy = 0;
      onTooltip(null);
      return;
    }

    const hit = hitTest(sx, sy, cam, rect.width, rect.height);
    onHover(hit?.id || null);
    if (hit) {
      onTooltip({ x: sx, y: sy, node: hit });
    } else {
      onTooltip(null);
    }
  }, [hitTest, onHover, onTooltip]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const wasDragging = dragRef.current.dragging &&
      (Math.abs(e.clientX - dragRef.current.startX) > 3 || Math.abs(e.clientY - dragRef.current.startY) > 3);
    dragRef.current.dragging = false;

    if (!wasDragging) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const hit = hitTest(sx, sy, cameraRef.current, rect.width, rect.height);
      onSelect(hit?.id || null);
    }
  }, [hitTest, onSelect]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const cam = cameraRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    // World point under cursor before zoom
    const wx = (sx - rect.width / 2) / cam.zoom + cam.x;
    const wy = (sy - rect.height / 2) / cam.zoom + cam.y;

    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    cam.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cam.zoom * factor));

    // Adjust camera so the world point stays under cursor
    cam.x = wx - (sx - rect.width / 2) / cam.zoom;
    cam.y = wy - (sy - rect.height / 2) / cam.zoom;
  }, []);

  // Space key for panning mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        dragRef.current.spaceHeld = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        dragRef.current.spaceHeld = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Scroll to selected node
  const scrollToFx = useCallback((nodeId: string) => {
    const n = layoutRef.current.nodes.find(n => n.id === nodeId);
    if (!n) return;
    const cam = cameraRef.current;
    cam.vx = (n.x - cam.x) * 2;
    cam.vy = (n.y - cam.y) * 2;
  }, [layoutRef]);

  useEffect(() => {
    if (selectedId) scrollToFx(selectedId);
  }, [selectedId, scrollToFx]);

  // Tooltip rendering (JSX overlay on top of canvas)
  const tooltipJSX = useMemo(() => {
    if (!tooltip) return null;
    return (
      <div
        className="pointer-events-none absolute z-10 px-3 py-2 rounded-lg text-xs font-medium shadow-lg backdrop-blur-md"
        style={{
          left: tooltip.x + 12,
          top: tooltip.y - 8,
          background: 'rgba(15,15,35,0.92)',
          color: '#e0e0f0',
          border: '1px solid rgba(160,120,255,0.3)',
          maxWidth: 220,
        }}
      >
        <div className="font-bold truncate">{tooltip.node.label}</div>
        <div className="opacity-60 text-[10px]">{tooltip.node.source_file}:{tooltip.node.source_location}</div>
      </div>
    );
  }, [tooltip]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { onHover(null); onTooltip(null); dragRef.current.dragging = false; }}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      />
      {tooltipJSX}
    </div>
  );
}

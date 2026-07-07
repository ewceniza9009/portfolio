import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { LayoutNode, LayoutState, Camera } from './useGraphLayout';
import type { GraphNode, GraphLink } from './constants';
import {
  COMMUNITY_PALETTE,
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

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Draw starfield background (static)
    ctx.save();
    const starSeed = 42;
    for (let i = 0; i < 120; i++) {
      const sx = ((starSeed * (i + 1) * 7919) % 10000) / 10000 * w;
      const sy = ((starSeed * (i + 1) * 6271) % 10000) / 10000 * h;
      const alpha = 0.15 + 0.25 * ((i % 5) / 4);
      const size = 0.5 + ((i % 3) * 0.3);
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,180,220,${alpha})`;
      ctx.fill();
    }
    ctx.restore();

    // ── Helper: draw community nebula glow ──
    const drawNebula = (cx: number, cy: number, community: number, radius: number, alpha: number) => {
      const col = COMMUNITY_PALETTE[community % COMMUNITY_PALETTE.length];
      const sx = (cx - cam.x) * cam.zoom + w / 2;
      const sy = (cy - cam.y) * cam.zoom + h / 2;
      const r = radius * cam.zoom;
      if (!isFinite(sx) || !isFinite(sy) || !isFinite(r) || r < 0.5) return;
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      grad.addColorStop(0, col + Math.round(alpha * 0.25 * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(0.6, col + Math.round(alpha * 0.08 * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(1, col + '00');
      ctx.fillStyle = grad;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
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
    const now = time;
    for (const n of nodes) {
      if (!vis.has(n.id)) continue;

      const isSel = n.id === sel;
      const isHov = n.id === hov;
      const isNeighbor = sel != null && visLinks.some(l => (l.source === sel && l.target === n.id) || (l.target === sel && l.source === n.id));

      let alpha = NODE_ALPHA_DIM;
      if (sel && (isSel || isNeighbor)) alpha = NODE_ALPHA_LIT;
      else if (!sel) alpha = isHov ? NODE_ALPHA_LIT : 0.7;

      const col = COMMUNITY_PALETTE[n.community % COMMUNITY_PALETTE.length];
      const radius = Math.min(NODE_BASE_RADIUS + n.degree * 0.9, NODE_MAX_RADIUS) * Math.min(cam.zoom, 1.5);

      // Drift
      const driftX = Math.cos(n.driftPhase + now * DRIFT_SPEED) * DRIFT_AMPLITUDE;
      const driftY = Math.sin(n.driftPhase + now * DRIFT_SPEED * 1.3 + 1) * DRIFT_AMPLITUDE;

      const sx2 = (n.x + driftX - cam.x) * cam.zoom + w / 2;
      const sy2 = (n.y + driftY - cam.y) * cam.zoom + h / 2;

      // Skip any node with non-finite screen coords
      if (!isFinite(sx2) || !isFinite(sy2) || !isFinite(radius) || radius < 0.3) continue;

      // Glow
      if (isSel || isHov || isNeighbor) {
        const glowR = radius * 3;
        const glowGrad = ctx.createRadialGradient(sx2, sy2, 0, sx2, sy2, glowR);
        glowGrad.addColorStop(0, col + Math.round(0.3 * 255).toString(16).padStart(2, '0'));
        glowGrad.addColorStop(1, col + '00');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(sx2 - glowR, sy2 - glowR, glowR * 2, glowR * 2);
      }

      // Node orb
      const orbGrad = ctx.createRadialGradient(sx2 - radius * 0.3, sy2 - radius * 0.3, 0, sx2, sy2, radius);
      orbGrad.addColorStop(0, '#ffffff' + Math.round(alpha * 0.9 * 255).toString(16).padStart(2, '0'));
      orbGrad.addColorStop(0.4, col + Math.round(alpha * 255).toString(16).padStart(2, '0'));
      orbGrad.addColorStop(1, col + Math.round(alpha * 0.4 * 255).toString(16).padStart(2, '0'));
      ctx.beginPath();
      ctx.arc(sx2, sy2, radius, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      // Selection ring
      if (isSel) {
        ctx.beginPath();
        ctx.arc(sx2, sy2, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff' + Math.round(0.7 * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label (only at sufficient zoom)
      if (cam.zoom >= 0.5 && (isSel || isHov || isNeighbor || n.degree > 3)) {
        ctx.font = `${isSel ? 'bold ' : ''}${Math.max(10, 11 / cam.zoom)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const labelAlpha = isSel ? 1 : isHov ? 0.95 : 0.7;
        // text shadow
        ctx.fillStyle = '#000000' + Math.round(labelAlpha * 200).toString(16).padStart(2, '0');
        ctx.fillText(n.label, sx2 + 1, sy2 + radius + 3);
        ctx.fillStyle = '#ffffff' + Math.round(labelAlpha * 255).toString(16).padStart(2, '0');
        ctx.fillText(n.label, sx2, sy2 + radius + 2);
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

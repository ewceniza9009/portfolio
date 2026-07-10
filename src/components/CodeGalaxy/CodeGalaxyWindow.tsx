import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Network, X, RotateCw } from "lucide-react";
import { useGraphData } from "./useGraphData";
import { useGraphLayout } from "./useGraphLayout";
import { CanvasGraph, type CanvasGraphHandle } from "./CanvasGraph";
import { SidePanel } from "./SidePanel";
import { FilterBar } from "./FilterBar";
import type { GraphNode } from "./constants";
import { COMMUNITY_PALETTE } from "./constants";
import { buildCodebaseContext } from "./buildCodebaseContext";

interface CodeGalaxyWindowProps {
  onClose: () => void;
  onOpenChat?: (prompt: string, codebaseContext?: string) => void;
}

export function CodeGalaxyWindow({
  onClose,
  onOpenChat,
}: CodeGalaxyWindowProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    node: GraphNode;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommunities, setSelectedCommunities] = useState<Set<number>>(
    new Set(),
  );
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const data = useGraphData();
  const { layout, layoutRef } = useGraphLayout(
    data.payload?.nodes || [],
    data.payload?.links || [],
  );

  // Search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !data.payload) return [];
    const q = searchQuery.toLowerCase();
    return data.payload.nodes
      .filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.source_file.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [searchQuery, data.payload]);

  // Visible nodes/links based on filters
  const visibleNodes = useMemo(() => {
    if (!data.payload) return new Set<string>();
    const set = new Set<string>();
    for (const n of data.payload.nodes) {
      if (selectedCommunities.size > 0 && !selectedCommunities.has(n.community))
        continue;
      if (selectedFiles.size > 0 && !selectedFiles.has(n.source_file)) continue;
      set.add(n.id);
    }
    return set;
  }, [data.payload, selectedCommunities, selectedFiles]);

  const visibleLinks = useMemo(() => {
    if (!data.payload) return [];
    return data.payload.links.filter(
      (l) => visibleNodes.has(l.source) && visibleNodes.has(l.target),
    );
  }, [data.payload, visibleNodes]);

  // Selected node data
  const selectedNode = useMemo(() => {
    if (!selectedId || !data.nodesById) return null;
    return data.nodesById.get(selectedId) || null;
  }, [selectedId, data.nodesById]);

  const selectedNeighbors = useMemo(() => {
    if (!selectedId || !data.linksByNode || !data.nodesById) return [];
    const links = data.linksByNode.get(selectedId) || [];
    return links
      .map((l) => {
        const otherId = l.source === selectedId ? l.target : l.source;
        return data.nodesById.get(otherId);
      })
      .filter((n): n is GraphNode => !!n);
  }, [selectedId, data.linksByNode, data.nodesById]);

  const selectedLinks = useMemo(() => {
    if (!selectedId || !data.linksByNode) return [];
    return data.linksByNode.get(selectedId) || [];
  }, [selectedId, data.linksByNode]);

  // Stable nodes list to prevent CanvasGraph from infinitely re-mounting
  const stableNodesList = useMemo(() => {
    return data.nodesById ? Array.from(data.nodesById.values()) : [];
  }, [data.nodesById]);

  // AI bridge
  const graphRef = useRef<CanvasGraphHandle>(null);

  const handleAskAI = useCallback(
    (node: GraphNode, neighbors: GraphNode[]) => {
      if (!onOpenChat || !data.payload) return;
      const neighborList = neighbors
        .slice(0, 10)
        .map((n) => `- ${n.label} (${n.source_file})`)
        .join("\n");
      const prompt = `Explain the role of "${node.label}" from ${node.source_file}:${node.source_location} in the codebase. It belongs to community "${node.community_name}" and connects to:\n${neighborList}\nWhat does it do and why is it important?`;
      const codebaseContext = buildCodebaseContext(data.payload, node, neighbors);
      onOpenChat(prompt, codebaseContext);
    },
    [onOpenChat, data.payload],
  );

  // Filter handlers
  const toggleCommunity = useCallback((id: number) => {
    setSelectedCommunities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleFile = useCallback((file: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  }, []);

  const clearCommunities = useCallback(() => {
    setSelectedCommunities(new Set());
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  // ── First-visit tutorial overlay ──
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("cg_tutorial_seen") !== "1";
    } catch {
      return false;
    }
  });
  const dismissTutorial = useCallback(() => {
    setShowTutorial(false);
    try {
      sessionStorage.setItem("cg_tutorial_seen", "1");
    } catch {}
  }, []);

  // ── Navigation history (breadcrumb) ──
  const [navHistory, setNavHistory] = useState<string[]>([]);
  useEffect(() => {
    if (!selectedId) {
      setNavHistory([]);
      return;
    }
    setNavHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last === selectedId) return prev;
      const existing = prev.indexOf(selectedId);
      if (existing >= 0) return prev.slice(0, existing + 1);
      return [...prev, selectedId];
    });
  }, [selectedId]);

  // ── Search matches across the whole graph (for in-scene highlight) ──
  const searchMatchIds = useMemo<Set<string> | null>(() => {
    if (!searchQuery.trim() || !data.payload) return null;
    const q = searchQuery.toLowerCase();
    const set = new Set<string>();
    for (const n of data.payload.nodes) {
      if (
        n.label.toLowerCase().includes(q) ||
        n.source_file.toLowerCase().includes(q)
      )
        set.add(n.id);
    }
    return set;
  }, [searchQuery, data.payload]);

  // ── Link hover tooltip + right-click context menu ──
  const [linkTip, setLinkTip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    node: GraphNode;
  } | null>(null);

  const handleContextFocus = useCallback(
    (id: string) => {
      setCtxMenu(null);
      setSelectedId(id);
    },
    [],
  );
  const handleContextCommunity = useCallback((node: GraphNode) => {
    setCtxMenu(null);
    setSelectedCommunities(new Set([node.community]));
  }, []);
  const handleContextAskAI = useCallback(
    (node: GraphNode) => {
      setCtxMenu(null);
      if (!onOpenChat || !data.payload) return;
      const links = data.linksByNode?.get(node.id) || [];
      const neighbors = links
        .map((l) => {
          const otherId = l.source === node.id ? l.target : l.source;
          return data.nodesById?.get(otherId);
        })
        .filter((n): n is GraphNode => !!n);
      handleAskAI(node, neighbors);
    },
    [onOpenChat, data.payload, data.linksByNode, data.nodesById, handleAskAI],
  );
  const handleContextCopy = useCallback((node: GraphNode) => {
    setCtxMenu(null);
    try {
      navigator.clipboard?.writeText(node.id);
    } catch {}
  }, []);

  // Dismiss the context menu with Escape.
  useEffect(() => {
    if (!ctxMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCtxMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctxMenu]);

  // Loading/error states
  if (data.loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-card)" }}
      >
        <div
          className="flex items-center justify-center h-full text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Loading code graph...
        </div>
      </motion.div>
    );
  }

  if (data.error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-card)" }}
      >
        <div
          className="flex items-center justify-center h-full text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Failed to load graph: {data.error}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-[100] shadow-2xl overflow-hidden text-sm border-0 rounded-none flex flex-col"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--accent)",
        boxShadow:
          "0 10px 40px rgba(0, 0, 0, 0.3), 0 0 40px color-mix(in srgb, var(--accent) 20%, transparent)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b select-none z-30 relative"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, var(--bg-secondary)) 0%, var(--bg-card) 100%)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, var(--accent-secondary)) 100%)",
              boxShadow:
                "0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
          >
            <Network size={16} className="text-[var(--bg-primary)]" />
          </div>
          <div className="space-y-0.5">
            <div
              className="text-sm font-bold leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              Code Galaxy
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {data.payload?.nodes.length || 0} nodes ·{" "}
              {data.payload?.links.length || 0} edges
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-[11px] font-medium whitespace-nowrap hidden md:block" style={{ color: "var(--text-secondary)" }}>
            Click node→focus <span className="inline-block w-2 h-2 rounded-full mx-2 align-middle" style={{background:"var(--accent)",boxShadow:"0 0 6px var(--accent)"}} /> Dbl-click→fly <span className="inline-block w-2 h-2 rounded-full mx-2 align-middle" style={{background:"var(--accent)",boxShadow:"0 0 6px var(--accent)"}} /> Click connector→ride <span className="inline-block w-2 h-2 rounded-full mx-2 align-middle" style={{background:"var(--accent)",boxShadow:"0 0 6px var(--accent)"}} /> Click programmer
          </div>
          <div className="w-px h-5 hidden md:block" style={{ background: "var(--border)" }} />
          <button
            onClick={() => graphRef.current?.resetView()}
            title="Reset camera view"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-all active:scale-90"
            style={{ color: "var(--text-secondary)" }}
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-all active:scale-90"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 h-[calc(100%-56px)]">
        <CanvasGraph
          ref={graphRef}
          nodes={stableNodesList}
          links={data.payload?.links || []}
          layout={layout}
          layoutRef={layoutRef}
          selectedId={selectedId}
          onSelect={setSelectedId}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          visibleNodes={visibleNodes}
          visibleLinks={visibleLinks}
          tooltip={tooltip}
          onTooltip={setTooltip}
          searchMatchIds={searchMatchIds}
          onLinkTooltip={setLinkTip}
          onNodeContextMenu={(x, y, node) => setCtxMenu({ x, y, node })}
        />

        {/* Breadcrumb trail */}
        {navHistory.length > 0 && (
          <div className="absolute top-3 left-3 z-40 flex items-center gap-1 flex-wrap max-w-[60%]">
            {navHistory.map((id, i) => {
              const n = data.nodesById?.get(id);
              if (!n) return null;
              return (
                <span key={id} className="flex items-center gap-1">
                  {i > 0 && (
                    <span style={{ color: "var(--text-muted)" }}>›</span>
                  )}
                  <button
                    onClick={() => setSelectedId(id)}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors hover:brightness-125"
                    style={{
                      background:
                        i === navHistory.length - 1
                          ? "color-mix(in srgb, var(--accent) 25%, transparent)"
                          : "rgba(255,255,255,0.04)",
                      color:
                        i === navHistory.length - 1
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {n.label}
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Side panel */}
        {selectedNode && (
          <SidePanel
            node={selectedNode}
            neighbors={selectedNeighbors}
            links={selectedLinks}
            onClose={() => setSelectedId(null)}
            onAskAI={handleAskAI}
            onSelect={setSelectedId}
          />
        )}
        {/* Elite Hover Tooltip */}
        {tooltip && (
          <div
            className="fixed z-[200] pointer-events-none rounded-xl border backdrop-blur-xl shadow-2xl p-4 flex flex-col gap-2 transition-opacity duration-150"
            style={{
              left: tooltip.x + 15,
              top: tooltip.y + 15,
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 90%, transparent) 0%, color-mix(in srgb, var(--bg-secondary) 80%, transparent) 100%)",
              borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
              color: "var(--text-primary)",
              minWidth: "220px",
            }}
          >
            <div
              className="font-bold text-base border-b pb-2 mb-1 truncate"
              style={{ borderColor: "var(--border)" }}
            >
              {tooltip.node.label}
            </div>
            <div className="text-xs space-y-1">
              {tooltip.node.id === "__programmer__" ? (
                <>
                  <div className="flex justify-between items-center">
                    <span style={{ color: "var(--text-muted)" }}>Role</span>
                    <span
                      className="font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      {tooltip.node.source_file}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: "var(--text-muted)" }}>Created nodes</span>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>
                      {tooltip.node.degree}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span style={{ color: "var(--text-muted)" }}>Type</span>
                    <span
                      className="font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      {tooltip.node.file_type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: "var(--text-muted)" }}>Cluster</span>
                    <span className="font-mono">{tooltip.node.community}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: "var(--text-muted)" }}>Connections</span>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>
                      {tooltip.node.degree}
                    </span>
                  </div>
                  <div
                    className="pt-2 text-[10px] truncate"
                    style={{ maxWidth: "200px", color: "var(--text-muted)" }}
                  >
                    {tooltip.node.source_file}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Filter bar */}
        <FilterBar
          communities={data.communities}
          files={data.files}
          selectedCommunities={selectedCommunities}
          onToggleCommunity={toggleCommunity}
          selectedFiles={selectedFiles}
          onToggleFile={toggleFile}
          onSelectAllCommunities={clearCommunities}
          onSelectAllFiles={clearFiles}
          topHubs={data.topHubs}
          searchResults={searchResults}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onSelectResult={setSelectedId}
          nodeCount={data.payload?.nodes.length || 0}
          edgeCount={data.payload?.links.length || 0}
          communityCount={data.communities.length}
        />

        {/* Link relation tooltip */}
        {linkTip && (
          <div
            className="fixed z-[200] pointer-events-none rounded-lg border px-2.5 py-1.5 text-[11px] font-medium backdrop-blur-xl shadow-xl whitespace-nowrap"
            style={{
              left: linkTip.x + 14,
              top: linkTip.y + 14,
              background: "rgba(12,12,30,0.92)",
              borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
              color: "var(--text-primary)",
            }}
          >
            {linkTip.text}
          </div>
        )}

        {/* Right-click context menu */}
        {ctxMenu && (
          <>
            <div
              className="fixed inset-0 z-[190]"
              onClick={() => setCtxMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setCtxMenu(null);
              }}
            />
            <div
              className="fixed z-[200] rounded-xl border backdrop-blur-xl shadow-2xl py-1.5 text-xs overflow-hidden"
              style={{
                left: Math.min(ctxMenu.x, window.innerWidth - 180),
                top: Math.min(ctxMenu.y, window.innerHeight - 180),
                background: "rgba(12,12,30,0.96)",
                borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                color: "var(--text-primary)",
                minWidth: "160px",
              }}
            >
              <button
                onClick={() => handleContextFocus(ctxMenu.node.id)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors"
              >
                Focus this node
              </button>
              <button
                onClick={() => handleContextAskAI(ctxMenu.node)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors"
              >
                Ask AI about this
              </button>
              <button
                onClick={() => handleContextCommunity(ctxMenu.node)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors"
              >
                Show only this cluster
              </button>
              <button
                onClick={() => handleContextCopy(ctxMenu.node)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors"
              >
                Copy node id
              </button>
            </div>
          </>
        )}

        {/* Minimap */}
        <MiniMap
          visibleNodes={visibleNodes}
          getNodePositions={() => graphRef.current?.getNodePositions() ?? null}
          getViewState={() => graphRef.current?.getViewState() ?? null}
        />

        {/* First-visit tutorial overlay */}
        {showTutorial && (
          <div
            className="absolute inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={dismissTutorial}
          >
            <div
              className="max-w-sm w-[90%] rounded-2xl border p-6 shadow-2xl"
              style={{
                background: "var(--bg-card)",
                borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                Welcome to the Code Galaxy
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                Your codebase as a living solar system. A few ways to explore:
              </p>
              <ul className="space-y-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <li>• <b>Click</b> a node to focus and see its connections.</li>
                <li>• <b>Double-click</b> to fly the camera to a node (empty space resets the view).</li>
                <li>• <b>Click a glowing connector</b> to ride along the relationship.</li>
                <li>• <b>Hover</b> a node to preview its neighbours; <b>right-click</b> for quick actions.</li>
                <li>• <b>Search</b> (press /) highlights matches in the galaxy.</li>
                <li>• Keys: <b>Esc</b> deselect, <b>R</b> reset, <b>F</b> focus, <b>←/→</b> step through neighbours.</li>
              </ul>
              <button
                onClick={dismissTutorial}
                className="mt-5 w-full py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg-primary)",
                }}
              >
                Start exploring
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Minimap: a small 2D orientation map of the galaxy ── */
function MiniMap({
  visibleNodes,
  getNodePositions,
  getViewState,
}: {
  visibleNodes: Set<string>;
  getNodePositions: () => {
    id: string;
    x: number;
    y: number;
    z: number;
    community: number;
  }[] | null;
  getViewState: () => {
    camX: number;
    camY: number;
    camZ: number;
    tgtX: number;
    tgtY: number;
    tgtZ: number;
  } | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    const draw = (t: number) => {
      // Throttle to ~10fps.
      if (t - last > 100) {
        last = t;
        const pts = getNodePositions();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (pts && pts.length > 0) {
          let minX = Infinity,
            maxX = -Infinity,
            minZ = Infinity,
            maxZ = -Infinity;
          for (const p of pts) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minZ = Math.min(minZ, p.z);
            maxZ = Math.max(maxZ, p.z);
          }
          const pad = 14;
          const w = canvas.width - pad * 2;
          const h = canvas.height - pad * 2;
          const spanX = Math.max(1, maxX - minX);
          const spanZ = Math.max(1, maxZ - minZ);
          const project = (x: number, z: number) => ({
            px: pad + ((x - minX) / spanX) * w,
            py: pad + ((z - minZ) / spanZ) * h,
          });
          for (const p of pts) {
            const { px, py } = project(p.x, p.z);
            const col = COMMUNITY_PALETTE[p.community % COMMUNITY_PALETTE.length];
            const visible = visibleNodes.has(p.id);
            ctx.beginPath();
            ctx.arc(px, py, visible ? 1.6 : 0.8, 0, Math.PI * 2);
            ctx.fillStyle = visible ? col : "rgba(120,120,140,0.4)";
            ctx.fill();
          }
          const vs = getViewState();
          if (vs) {
            const cam = project(vs.camX, vs.camZ);
            const tgt = project(vs.tgtX, vs.tgtZ);
            ctx.strokeStyle = "rgba(167,139,250,0.7)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cam.px, cam.py);
            ctx.lineTo(tgt.px, tgt.py);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cam.px, cam.py, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tgt.px, tgt.py, 3, 0, Math.PI * 2);
            ctx.strokeStyle = "#a78bfa";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [visibleNodes, getNodePositions, getViewState]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={110}
      className="absolute top-3 right-3 z-40 rounded-lg border shadow-xl"
      style={{
        background: "rgba(8,8,20,0.85)",
        borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
      }}
      title="Galaxy minimap"
    />
  );
}

import { useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Network, X, RotateCw } from "lucide-react";
import { useGraphData } from "./useGraphData";
import { useGraphLayout } from "./useGraphLayout";
import { CanvasGraph, type CanvasGraphHandle } from "./CanvasGraph";
import { SidePanel } from "./SidePanel";
import { FilterBar } from "./FilterBar";
import type { GraphNode } from "./constants";
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
        />

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
      </div>
    </motion.div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Hash, GitBranch, Sparkles, ChevronRight } from 'lucide-react';
import type { GraphNode, GraphLink } from './constants';
import { COMMUNITY_PALETTE, RELATION_LABELS, RELATION_COLORS } from './constants';

interface SidePanelProps {
  node: GraphNode | null;
  neighbors: GraphNode[];
  links: GraphLink[];
  onClose: () => void;
  onAskAI: (node: GraphNode, neighbors: GraphNode[]) => void;
  onSelect: (id: string) => void;
}

export function SidePanel({ node, neighbors, links, onClose, onAskAI, onSelect }: SidePanelProps) {
  if (!node) return null;

  const col = COMMUNITY_PALETTE[node.community % COMMUNITY_PALETTE.length];

  // Group neighbors by relation type
  const grouped = new Map<string, { link: GraphLink; neighbor: GraphNode }[]>();
  for (const link of links) {
    const otherId = link.source === node.id ? link.target : link.source;
    const other = neighbors.find(n => n.id === otherId);
    if (!other) continue;
    const key = link.relation;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({ link, neighbor: other });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute top-0 right-3 bottom-16 w-60 z-50 overflow-y-auto backdrop-blur-xl rounded-xl shadow-2xl"
        style={{
          background: 'rgba(12,12,30,0.95)',
          borderLeft: '1px solid rgba(160,120,255,0.2)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(160,120,255,0.15)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: col }} />
            <span className="text-sm font-bold text-white truncate">{node.label}</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: '#888' }}>
            <X size={14} />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 py-3 space-y-2 text-xs" style={{ color: '#aaa' }}>
          <div className="flex items-center gap-2">
            <FileText size={12} style={{ color: col }} />
            <span className="text-white/80">{node.source_file}</span>
            <span className="opacity-50">{node.source_location}</span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch size={12} style={{ color: col }} />
            <span className="text-white/80">{node.community_name}</span>
            <span className="opacity-50">comm {node.community}</span>
          </div>
          <div className="flex items-center gap-2">
            <Hash size={12} style={{ color: col }} />
            <span className="text-white/80">{node.degree} connections</span>
          </div>
        </div>

        {/* Ask AI */}
        <div className="px-4 pb-3">
          <button
            onClick={() => onAskAI(node, neighbors)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${col}40, ${col}20)`,
              color: '#fff',
              border: `1px solid ${col}50`,
            }}
          >
            <Sparkles size={12} /> Ask AI about this
          </button>
        </div>

        {/* Neighbors by relation */}
        <div className="px-4 pb-4 space-y-3">
          <div className="text-[10px] uppercase tracking-wider font-semibold opacity-50">Connections</div>
          {Array.from(grouped.entries()).map(([rel, items]) => (
            <div key={rel}>
              <div className="text-[10px] font-semibold mb-1 flex items-center gap-1" style={{ color: RELATION_COLORS[rel] || '#666' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: RELATION_COLORS[rel] || '#666' }} />
                {RELATION_LABELS[rel] || rel} ({items.length})
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 8).map(({ neighbor }) => (
                  <button
                    key={neighbor.id}
                    onClick={() => onSelect(neighbor.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors hover:bg-white/5 group"
                    style={{ color: '#ccc' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: COMMUNITY_PALETTE[neighbor.community % COMMUNITY_PALETTE.length] }} />
                    <span className="truncate flex-1">{neighbor.label}</span>
                    <ChevronRight size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </button>
                ))}
                {items.length > 8 && (
                  <div className="text-[10px] opacity-40 pl-4">+{items.length - 8} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

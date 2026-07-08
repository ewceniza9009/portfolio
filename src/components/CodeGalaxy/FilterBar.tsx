import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, BarChart3, FileCode2, Network, ChevronDown, ChevronUp } from 'lucide-react';
import { COMMUNITY_PALETTE } from './constants';
import type { GraphNode } from './constants';

interface FilterBarProps {
  communities: { id: number; name: string; count: number }[];
  files: string[];
  selectedCommunities: Set<number>;
  onToggleCommunity: (id: number) => void;
  selectedFiles: Set<string>;
  onToggleFile: (file: string) => void;
  onSelectAllCommunities: () => void;
  onSelectAllFiles: () => void;
  topHubs: { id: string; label: string; degree: number; source_file: string }[];
  searchResults: GraphNode[];
  searchQuery: string;
  onSearch: (q: string) => void;
  onSelectResult: (id: string) => void;
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
}

export function FilterBar({
  communities,
  files,
  selectedCommunities,
  onToggleCommunity,
  selectedFiles,
  onToggleFile,
  onSelectAllCommunities,
  onSelectAllFiles,
  topHubs,
  searchResults,
  searchQuery,
  onSearch,
  onSelectResult,
  nodeCount,
  edgeCount,
  communityCount,
}: FilterBarProps) {
  const [showStats, setShowStats] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showCommunities, setShowCommunities] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Keyboard nav in search results
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusIndex >= 0 && searchResults[focusIndex]) {
      e.preventDefault();
      onSelectResult(searchResults[focusIndex].id);
      onSearch('');
      setFocusIndex(-1);
    } else if (e.key === 'Escape') {
      onSearch('');
      setFocusIndex(-1);
      inputRef.current?.blur();
    }
  }, [searchResults, focusIndex, onSelectResult, onSearch]);

  // Scroll focused result into view
  useEffect(() => {
    if (focusIndex < 0 || !resultsRef.current) return;
    const el = resultsRef.current.children[focusIndex] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusIndex]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10" style={{ pointerEvents: 'none' }}>
      {/* Search results dropdown */}
      {searchQuery && searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute bottom-full left-2 right-2 mb-1 max-h-48 overflow-y-auto rounded-lg backdrop-blur-xl shadow-xl"
          style={{
            background: 'rgba(12,12,30,0.95)',
            border: '1px solid rgba(160,120,255,0.2)',
            pointerEvents: 'auto',
          }}
        >
          {searchResults.map((n, i) => (
            <button
              key={n.id}
              onClick={() => { onSelectResult(n.id); onSearch(''); setFocusIndex(-1); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
              style={{
                background: i === focusIndex ? 'rgba(160,120,255,0.15)' : 'transparent',
                color: '#ccc',
              }}
              onMouseEnter={() => setFocusIndex(i)}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COMMUNITY_PALETTE[n.community % COMMUNITY_PALETTE.length] }} />
              <span className="truncate font-medium">{n.label}</span>
              <span className="opacity-40 ml-auto">{n.source_file}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main bar */}
      <div
        className="flex items-center gap-2 px-2 py-2 mx-2 mb-2 rounded-xl backdrop-blur-xl shadow-xl"
        style={{
          background: 'rgba(12,12,30,0.9)',
          border: '1px solid rgba(160,120,255,0.15)',
          pointerEvents: 'auto',
        }}
      >
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <Search size={13} style={{ color: '#888' }} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => { onSearch(e.target.value); setFocusIndex(-1); }}
            onKeyDown={handleKeyDown}
            placeholder="Search... ( / )"
            className="flex-1 bg-transparent outline-none text-xs text-white placeholder:text-white/30"
          />
          {searchQuery && (
            <button onClick={() => { onSearch(''); setFocusIndex(-1); }} className="hover:text-white transition-colors" style={{ color: '#666' }}>
              <X size={11} />
            </button>
          )}
        </div>

        {/* Stats toggle */}
        <button
          onClick={() => { setShowStats(!showStats); setShowCommunities(false); setShowFiles(false); }}
          className="px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-white/10"
          style={{ color: showStats ? '#a78bfa' : '#888' }}
        >
          <BarChart3 size={14} />
        </button>

        {/* Community filter */}
        <button
          onClick={() => { setShowCommunities(!showCommunities); setShowFiles(false); setShowStats(false); }}
          className="px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-white/10 flex items-center gap-1"
          style={{ color: selectedCommunities.size > 0 ? '#a78bfa' : '#888' }}
        >
          <Network size={14} />
          {selectedCommunities.size > 0 && <span>{selectedCommunities.size}</span>}
          {showCommunities ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
        </button>

        {/* File filter */}
        <button
          onClick={() => { setShowFiles(!showFiles); setShowCommunities(false); setShowStats(false); }}
          className="px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-white/10 flex items-center gap-1"
          style={{ color: selectedFiles.size > 0 ? '#a78bfa' : '#888' }}
        >
          <FileCode2 size={14} />
          {selectedFiles.size > 0 && <span>{selectedFiles.size}</span>}
          {showFiles ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
        </button>
      </div>

      {/* Stats overlay */}
      {showStats && (
        <div
          className="absolute bottom-16 left-2 right-2 rounded-lg p-3 backdrop-blur-xl shadow-xl"
          style={{
            background: 'rgba(12,12,30,0.95)',
            border: '1px solid rgba(160,120,255,0.2)',
            pointerEvents: 'auto',
          }}
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'rgba(200,180,255,0.6)' }}>Code Graph Stats</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: '#fff' }}>{nodeCount}</div>
              <div className="text-[10px]" style={{ color: 'rgba(200,200,220,0.5)' }}>Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: '#fff' }}>{edgeCount}</div>
              <div className="text-[10px]" style={{ color: 'rgba(200,200,220,0.5)' }}>Edges</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: '#fff' }}>{communityCount}</div>
              <div className="text-[10px]" style={{ color: 'rgba(200,200,220,0.5)' }}>Communities</div>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'rgba(200,180,255,0.6)' }}>Top God Nodes</div>
          <div className="space-y-1">
            {topHubs.slice(0, 5).map((h, i) => (
              <div key={h.id} className="flex items-center gap-2 text-[11px]" style={{ color: '#ccc' }}>
                <span style={{ color: 'rgba(200,200,220,0.4)' }} className="w-3">{i + 1}</span>
                <span className="font-medium truncate">{h.label}</span>
                <span style={{ color: 'rgba(200,200,220,0.4)' }} className="ml-auto">{h.degree} edges</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community filter panel */}
      {showCommunities && (
        <div
          className="absolute bottom-16 left-2 right-2 max-h-64 overflow-y-auto rounded-lg p-3 backdrop-blur-xl shadow-xl"
          style={{
            background: 'rgba(12,12,30,0.95)',
            border: '1px solid rgba(160,120,255,0.2)',
            pointerEvents: 'auto',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(200,180,255,0.6)' }}>Communities</div>
            <button
              onClick={(e) => { e.stopPropagation(); onSelectAllCommunities(); }}
              className="px-2 py-1 rounded text-[10px] font-semibold transition-all hover:brightness-125"
              style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
            >
              {selectedCommunities.size > 0 ? 'Show all' : 'Clear'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {communities.map(c => {
              const col = COMMUNITY_PALETTE[c.id % COMMUNITY_PALETTE.length];
              const active = selectedCommunities.size === 0 || selectedCommunities.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={(e) => { e.stopPropagation(); onToggleCommunity(c.id); }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all hover:brightness-125"
                  style={{
                    background: active ? `${col}25` : 'rgba(255,255,255,0.03)',
                    color: active ? '#fff' : '#555',
                    border: `1px solid ${active ? col + '50' : 'transparent'}`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: active ? col : '#333' }} />
                  {c.name} ({c.count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* File filter panel */}
      {showFiles && (
        <div
          className="absolute bottom-16 left-2 right-2 max-h-64 overflow-y-auto rounded-lg p-3 backdrop-blur-xl shadow-xl"
          style={{
            background: 'rgba(12,12,30,0.95)',
            border: '1px solid rgba(160,120,255,0.2)',
            pointerEvents: 'auto',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(200,180,255,0.6)' }}>Files</div>
            <button
              onClick={(e) => { e.stopPropagation(); onSelectAllFiles(); }}
              className="px-2 py-1 rounded text-[10px] font-semibold transition-all hover:brightness-125"
              style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
            >
              {selectedFiles.size > 0 ? 'Show all' : 'Clear'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {files.map(f => {
              const active = selectedFiles.size === 0 || selectedFiles.has(f);
              return (
                <button
                  key={f}
                  onClick={(e) => { e.stopPropagation(); onToggleFile(f); }}
                  className="px-2 py-1 rounded-md text-[10px] font-medium transition-all hover:brightness-125"
                  style={{
                    background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#fff' : '#555',
                    border: `1px solid ${active ? 'rgba(167,139,250,0.4)' : 'transparent'}`,
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { FileText, Minimize2, Maximize2, X, Check } from "lucide-react";
import MarkdownEditor from "../MarkdownEditor";

interface FocusModeOverlayProps {
  focusContentMode: boolean;
  setFocusContentMode: (val: boolean) => void;
  blogTitle: string;
  blogContent: string;
  setBlogContent: (val: string) => void;
  blogWords: string[];
  setMonacoEditor: (editor: any) => void;
  renderInlinePreview: (type: string, code: string, blockId: string) => React.ReactNode;
  zoomedBlock: { type: string; code: string; startLine: number; endLine: number } | null;
  setZoomedBlock: (block: { type: string; code: string; startLine: number; endLine: number } | null) => void;
  zoomedCode: string;
  setZoomedCode: (val: string) => void;
  debouncedZoomedCode: string;
  applyZoomedChanges: () => void;
}

export default function FocusModeOverlay({
  focusContentMode,
  setFocusContentMode,
  blogTitle,
  blogContent,
  setBlogContent,
  blogWords,
  setMonacoEditor,
  renderInlinePreview,
  zoomedBlock,
  setZoomedBlock,
  zoomedCode,
  setZoomedCode,
  debouncedZoomedCode,
  applyZoomedChanges,
}: FocusModeOverlayProps) {
  return (
    <>
      <AnimatePresence>
        {focusContentMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{ background: "var(--bg-primary)" }}
          >
            {/* Focus Header */}
            <div
              className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0"
              style={{
                borderColor: "var(--border)",
                background: "var(--glass-bg)",
              }}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} style={{ color: "var(--accent)" }} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Focus Editor
                </span>
                {blogTitle && (
                  <span className="text-xs opacity-50">— {blogTitle}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFocusContentMode(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border hover:brightness-110 transition-all"
                  style={{
                    background: "var(--accent)",
                    color: "var(--bg-primary)",
                  }}
                >
                  <Minimize2 size={12} /> Exit Focus
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full">
              <MarkdownEditor
                value={blogContent}
                onChange={setBlogContent}
                height="100%"
                autoFocus
                onEditorMount={setMonacoEditor}
                extraWords={blogWords}
                showToolbar
                renderInlinePreview={renderInlinePreview}
                onZoomBlock={setZoomedBlock}
              />
            </div>

            {/* Focus Footer */}
            <div
              className="flex items-center justify-between px-4 sm:px-6 py-2 border-t text-[10px] shrink-0"
              style={{
                borderColor: "var(--border)",
                background: "var(--glass-bg)",
                color: "var(--text-muted)",
              }}
            >
              <span>
                {blogContent.split(/\s+/).filter(Boolean).length} words ·{" "}
                {blogContent.length} chars ·{" "}
                {blogContent.split("\n").length} lines
              </span>
              <button
                type="button"
                onClick={() => setFocusContentMode(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border hover:brightness-110 transition-all sm:hidden"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg-primary)",
                }}
              >
                <Minimize2 size={12} /> Exit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Zoom Modal ── */}
      <AnimatePresence>
        {zoomedBlock && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[10000] flex flex-col bg-black/90 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent)] text-black rounded-lg">
                  <Maximize2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Zoomed View: {zoomedBlock.type}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Isolating lines {zoomedBlock.startLine} to {zoomedBlock.endLine}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoomedBlock(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={applyZoomedChanges}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110 flex items-center gap-2"
                  style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
                >
                  <Check size={14} /> Save & Close
                </button>
              </div>
            </div>

            {/* Split Pane */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Left Pane: Code Editor */}
              <div className="w-1/2 flex flex-col border-r border-gray-800">
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 bg-gray-900/80 uppercase tracking-wider border-b border-gray-800">
                  Edit Code
                </div>
                <div className="flex-1 min-h-0">
                  <MarkdownEditor
                    value={zoomedCode}
                    onChange={setZoomedCode}
                    height="100%"
                    autoFocus
                  />
                </div>
              </div>

              {/* Right Pane: Live Preview & Console */}
              <div className="w-1/2 flex flex-col bg-[var(--bg-card)]">
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 bg-gray-900/80 uppercase tracking-wider border-b border-gray-800">
                  Live Preview & Console
                </div>
                <div className="flex-1 min-h-0 relative overflow-hidden">
                  {renderInlinePreview(zoomedBlock.type, debouncedZoomedCode, "zoom-preview")}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

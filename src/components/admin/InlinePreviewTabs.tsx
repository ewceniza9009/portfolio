import { useState } from 'react'
import { Sparkles, Loader } from 'lucide-react'

interface InlinePreviewTabsProps {
  content: React.ReactNode
  previewLogs: any[]
  setPreviewLogs: (logs: any[]) => void
  handleAskAiFix: (id: string, msg: string) => void
  fixingErrorId: string | null
  aiSuggestions: Record<string, string>
}

export default function InlinePreviewTabs({ content, previewLogs, setPreviewLogs, handleAskAiFix, fixingErrorId, aiSuggestions }: InlinePreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview')

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)]">
      <div className="flex items-center gap-2 px-3 pt-2 pb-0 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <button
          onPointerDown={(e) => { e.stopPropagation(); setActiveTab('preview'); }}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'preview' ? 'border-[var(--accent)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
        >
          Preview
        </button>
        <button
          onPointerDown={(e) => { e.stopPropagation(); setActiveTab('console'); }}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'console' ? 'border-[var(--accent)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
        >
          Console
          {previewLogs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[9px]">{previewLogs.length}</span>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 h-full w-full ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
          {content}
        </div>
        <div className={`absolute inset-0 h-full w-full ${activeTab === 'console' ? 'block' : 'hidden'}`}>
          <div className="h-full bg-black p-4 overflow-y-auto font-mono text-[11px] leading-relaxed relative">
            <div className="sticky top-0 left-0 bg-black/80 backdrop-blur pb-3 flex justify-between items-center border-b border-gray-800/50 mb-3 z-10">
              <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Console Logs</span>
              <button
                onPointerDown={(e) => { e.stopPropagation(); setPreviewLogs([]); }}
                className="text-[9px] uppercase font-bold tracking-wider px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              >
                Clear Logs
              </button>
            </div>
            {previewLogs.length === 0 ? (
              <div className="text-gray-600 italic text-center mt-8">No logs captured.</div>
            ) : (
              <div className="space-y-4">
                {previewLogs.map((log: any) => (
                  <div key={log.id} className="pb-3 border-b border-gray-800/50">
                    <div className="flex gap-2">
                      <span className="text-gray-500 shrink-0">{log.time}</span>
                      <span className={`flex-1 whitespace-pre-wrap ${
                        log.type === "error" ? "text-red-400" :
                        log.type === "warn" ? "text-yellow-400" :
                        "text-blue-300"
                      }`}>
                        {log.msg}
                      </span>
                    </div>
                    {log.type === "error" && log.msg.includes("THREE.CSS2DObject is not a constructor") && (
                      <div className="mt-2 ml-14 p-2 rounded bg-gray-900 border border-gray-700 text-gray-300 text-[10px]">
                        💡 <strong>Tip:</strong> Remove the <code>THREE.</code> namespace. Import and use <code>CSS2DObject</code> directly.
                      </div>
                    )}
                    {log.type === "error" && (
                      <div className="mt-2 ml-14">
                        {!aiSuggestions[log.id] && fixingErrorId !== log.id && (
                          <button
                            onPointerDown={(e) => { e.stopPropagation(); handleAskAiFix(log.id, log.msg); }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors border border-indigo-500/30 font-sans text-[9px] font-bold"
                          >
                            <Sparkles size={10} /> Ask AI to Fix
                          </button>
                        )}
                        {fixingErrorId === log.id && (
                          <div className="flex items-center gap-1.5 text-indigo-400 text-[9px] font-sans">
                            <Loader size={10} className="animate-spin" /> Analyzing error...
                          </div>
                        )}
                        {aiSuggestions[log.id] && (
                          <div className="p-3 rounded bg-indigo-500/10 border border-indigo-500/20 font-sans mt-2 shadow-inner">
                            <div className="text-indigo-400 font-bold text-[10px] mb-1.5 flex items-center gap-1.5">
                              <Sparkles size={10} /> AI Suggestion:
                            </div>
                            <div className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">{aiSuggestions[log.id]}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

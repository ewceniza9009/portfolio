import { useState, useEffect } from "react";
import { Search, Trash2, Clock, ShieldAlert } from "lucide-react";
import { apiFetch } from "../../utils/api";
import { formatDate } from "../../utils/format";

interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all audit logs? This cannot be undone.")) return;
    try {
      const res = await apiFetch("/api/admin/audit-logs", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to clear logs", err);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase()) ||
    (log.admin_email && log.admin_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full rounded-2xl border overflow-hidden" style={{ background: "var(--glass-bg)", borderColor: "var(--border-color)" }}>
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-black/10" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-500">
            <ShieldAlert size={16} />
          </div>
          <h2 className="font-semibold text-lg">Audit Logs</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl border text-sm w-64 bg-transparent outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
              style={{ borderColor: "var(--border-color)", color: "var(--text-color)" }}
            />
          </div>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-red-500 hover:bg-red-500/10 transition-colors text-sm"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Trash2 size={14} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No audit logs found.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-black/20 text-xs uppercase" style={{ color: "var(--text-muted)" }}>
              <tr>
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Admin</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Entity</th>
                <th className="px-6 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock size={12} style={{ color: "var(--text-muted)" }} />
                      <span>{formatDate(log.created_at, { time: true })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.admin_email || 'System'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      log.action === 'DELETE' ? 'bg-red-500/20 text-red-500' :
                      log.action === 'UPDATE' ? 'bg-blue-500/20 text-blue-500' :
                      log.action === 'CREATE' ? 'bg-green-500/20 text-green-500' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.entity} <span className="text-xs" style={{ color: "var(--text-muted)" }}>{log.entity_id}</span></td>
                  <td className="px-6 py-4">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

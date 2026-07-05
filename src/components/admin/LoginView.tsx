import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

interface LoginViewProps {
  password: string
  setPassword: (val: string) => void
  handleLogin: (e: React.FormEvent) => void
  loginError: string
}

export default function LoginView({ password, setPassword, handleLogin, loginError }: LoginViewProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 transition-all duration-300"
      style={{ background: "var(--bg-primary)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-md rounded-3xl p-8 glass shadow-2xl border"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-center mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center border shadow-inner"
            style={{
              background: "var(--accent-dim)",
              borderColor: "var(--accent)",
            }}
          >
            <Lock size={24} style={{ color: "var(--accent)" }} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center mb-1">
          Developer Cockpit
        </h2>
        <p
          className="text-xs text-center mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          Enter credentials to access admin functions
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Security Token
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                outlineColor: "var(--accent)",
              }}
              autoFocus
            />
          </div>
          {loginError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-center font-medium"
              style={{ color: "#ef4444" }}
            >
              {loginError}
            </motion.p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:brightness-110 active:scale-[0.98]"
            style={{
              background: "var(--accent)",
              color: "var(--bg-primary)",
            }}
          >
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  )
}

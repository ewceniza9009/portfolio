import type { ChangeEvent } from "react";
import {
  Settings,
  CheckCircle2,
  Lock,
  RefreshCw,
  Loader,
  Download,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  BookOpen,
  Workflow,
  Activity,
} from "lucide-react";
import { ACCENT_THEMES } from "../../data/accents";
import type { Blog } from "../../types/blog";

interface SettingsTabProps {
  blogs: Blog[];
  defaultTheme: "dark" | "light" | null;
  defaultAccent: string | null;
  rotationThemeEnabled: boolean;
  rotationAccentEnabled: boolean;
  rotationIntervalHours: number;
  cursorEnabled: boolean;
  paypalDonateUrl: string;
  setPaypalDonateUrl: (val: string) => void;
  paypalSaved: boolean;
  defaultAiModel: string;
  setDefaultAiModel: (val: string) => void;
  defaultAiModelSaved: boolean;
  aiProvider: string;
  setAiProvider: (val: string) => void;
  aiProviderSaved: boolean;
  aiProvidersConfig: Record<
    string,
    {
      name: string;
      defaultModel: string;
      freeModels: string[];
      requiresApiKey: boolean;
      apiKeyEnv?: string;
    }
  >;
  aiModels: string[];
  featuredSlug: string;
  setFeaturedSlugLocal: (val: string) => void;
  featuredSaved: boolean;
  n8nPortfolioKey: string;
  setN8nPortfolioKey: (val: string) => void;
  n8nDevtoKey: string;
  setN8nDevtoKey: (val: string) => void;
  n8nWebhookUrl: string;
  setN8nWebhookUrl: (val: string) => void;
  n8nSaved: boolean;
  devtoApiKey: string;
  setDevtoApiKey: (val: string) => void;
  devtoUsername: string;
  setDevtoUsername: (val: string) => void;
  devtoSaved: boolean;
  devtoStatus: any[];
  devtoStatusLoading: boolean;
  profilePicUrl: string;
  profilePicUploading: boolean;
  profilePicResetting: boolean;
  profilePicMsg: { type: "ok" | "err"; text: string } | null;
  profilePicFileRef: React.RefObject<HTMLInputElement>;
  generatingToken: boolean;
  downloading: boolean;
  tokenExists: boolean;
  handleDefaultThemeChange: (val: string) => void;
  handleDefaultAccentChange: (val: string) => void;
  toggleRotationTheme: () => void;
  toggleRotationAccent: () => void;
  handleIntervalChange: (e: ChangeEvent<HTMLInputElement>) => void;
  toggleCursor: () => void;
  handleProfilePicUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  handleProfilePicReset: () => void;
  handleFeaturedSave: () => void;
  handlePaypalSave: () => void;
  handleProviderSave: () => void;
  handleDevtoModelSave: () => void;
  handleDevtoSettingsSave: () => void;
  handleGenerateToken: () => void;
  handleRevokeToken: () => void;
  handleDownloadWorkflow: () => void;
  handleN8nSave: () => void;
  loadDevtoStatus: () => void;
  getRequiredFieldsFilled: () => boolean;
}

export default function SettingsTab({
  blogs,
  defaultTheme,
  defaultAccent,
  rotationThemeEnabled,
  rotationAccentEnabled,
  rotationIntervalHours,
  cursorEnabled,
  paypalDonateUrl,
  setPaypalDonateUrl,
  paypalSaved,
  defaultAiModel,
  setDefaultAiModel,
  defaultAiModelSaved,
  aiProvider,
  setAiProvider,
  aiProviderSaved,
  aiProvidersConfig,
  aiModels,
  featuredSlug,
  setFeaturedSlugLocal,
  featuredSaved,
  n8nPortfolioKey,
  setN8nPortfolioKey,
  n8nDevtoKey,
  setN8nDevtoKey,
  n8nWebhookUrl,
  setN8nWebhookUrl,
  n8nSaved,
  devtoApiKey,
  setDevtoApiKey,
  devtoUsername,
  setDevtoUsername,
  devtoSaved,
  devtoStatus,
  devtoStatusLoading,
  profilePicUrl,
  profilePicUploading,
  profilePicResetting,
  profilePicMsg,
  profilePicFileRef,
  generatingToken,
  downloading,
  tokenExists,
  handleDefaultThemeChange,
  handleDefaultAccentChange,
  toggleRotationTheme,
  toggleRotationAccent,
  handleIntervalChange,
  toggleCursor,
  handleProfilePicUpload,
  handleProfilePicReset,
  handleFeaturedSave,
  handlePaypalSave,
  handleProviderSave,
  handleDevtoModelSave,
  handleDevtoSettingsSave,
  handleGenerateToken,
  handleRevokeToken,
  handleDownloadWorkflow,
  handleN8nSave,
  loadDevtoStatus,
  getRequiredFieldsFilled,
}: SettingsTabProps) {
  return (
    <div
      className="col-span-12 flex flex-col h-full rounded-2xl border overflow-hidden"
      style={{
        background: "var(--glass-bg)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="p-6 border-b shrink-0 flex items-center gap-2"
        style={{ borderColor: "var(--border)" }}
      >
        <Settings size={18} style={{ color: "var(--accent)" }} />
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Settings
          </h3>
          <p
            className="text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            Manage your portfolio configuration
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Group: Appearance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-dim)" }}
            >
              <Settings size={14} style={{ color: "var(--accent)" }} />
            </div>
            <h4
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Appearance
            </h4>
          </div>

          <div className="grid gap-4">
            {/* Default Theme */}
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-8 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Default Theme
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Set a fixed fallback theme. Selecting a specific theme
                  disables automatic rotation.
                </p>
              </div>
              <div className="md:col-span-4 flex justify-end gap-2">
                <button
                  onClick={() => handleDefaultThemeChange("auto")}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98]"
                  style={{
                    background:
                      defaultTheme === null
                        ? "var(--accent)"
                        : "var(--bg-secondary)",
                    borderColor:
                      defaultTheme === null
                        ? "var(--accent)"
                        : "var(--border)",
                    color:
                      defaultTheme === null
                        ? "var(--bg-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  Auto
                </button>
                <button
                  onClick={() => handleDefaultThemeChange("dark")}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98]"
                  style={{
                    background:
                      defaultTheme === "dark"
                        ? "var(--accent)"
                        : "var(--bg-secondary)",
                    borderColor:
                      defaultTheme === "dark"
                        ? "var(--accent)"
                        : "var(--border)",
                    color:
                      defaultTheme === "dark"
                        ? "var(--bg-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  Dark
                </button>
                <button
                  onClick={() => handleDefaultThemeChange("light")}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98]"
                  style={{
                    background:
                      defaultTheme === "light"
                        ? "var(--accent)"
                        : "var(--bg-secondary)",
                    borderColor:
                      defaultTheme === "light"
                        ? "var(--accent)"
                        : "var(--border)",
                    color:
                      defaultTheme === "light"
                        ? "var(--bg-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  Light
                </button>
              </div>
            </div>

            {/* Default Accent Color */}
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-8 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Default Accent Color
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Set a fixed fallback accent. Selecting a specific
                  accent disables automatic rotation.
                </p>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <select
                  value={
                    defaultAccent === null ? "auto" : defaultAccent
                  }
                  onChange={(e) =>
                    handleDefaultAccentChange(e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                >
                  <option value="auto">Auto (Rotation)</option>
                  {Object.entries(ACCENT_THEMES).map(([key, theme]) => (
                    <option key={key} value={key}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Theme Rotation */}
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-8 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Automatic Theme Rotation
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Automatically alternate between Light and Dark mode.
                </p>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={toggleRotationTheme}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] flex items-center gap-2"
                  style={{
                    background: rotationThemeEnabled
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                    borderColor: rotationThemeEnabled
                      ? "var(--accent)"
                      : "var(--border)",
                    color: rotationThemeEnabled
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {rotationThemeEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>

            {/* Accent Rotation */}
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-8 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Automatic Accent Color Rotation
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Automatically cycle through different accent colors.
                </p>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={toggleRotationAccent}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] flex items-center gap-2"
                  style={{
                    background: rotationAccentEnabled
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                    borderColor: rotationAccentEnabled
                      ? "var(--accent)"
                      : "var(--border)",
                    color: rotationAccentEnabled
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {rotationAccentEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>

            {/* Rotation Interval */}
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-8 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Rotation Time Interval
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  How often themes/accents should change (1-24 hours).
                </p>
              </div>
              <div className="md:col-span-4 flex items-center justify-end gap-3">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={rotationIntervalHours}
                  onChange={handleIntervalChange}
                  className="w-20 px-3 py-2 rounded-lg text-sm text-center border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  hours
                </span>
              </div>
            </div>
          </div>

          {/* Cursor Style */}
          <div
            className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="md:col-span-8 space-y-1">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Ring Cursor
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Animated ring that follows the mouse pointer.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={toggleCursor}
                className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] flex items-center gap-2"
                style={{
                  background: cursorEnabled
                    ? "var(--accent)"
                    : "transparent",
                  borderColor: cursorEnabled
                    ? "var(--accent)"
                    : "var(--border)",
                  color: cursorEnabled
                    ? "var(--bg-primary)"
                    : "var(--text-secondary)",
                }}
              >
                {cursorEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>

        {/* Group: Profile */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-dim)" }}
            >
              <ImageIcon size={14} style={{ color: "var(--accent)" }} />
            </div>
            <h4
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Profile
            </h4>
          </div>

          <div className="grid gap-4">
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-7 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Profile Picture
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Upload once — shows on Hero, blog posts, and index.
                  Supported: PNG, JPG, WEBP, GIF (max 4MB).
                </p>
              </div>
              <div className="md:col-span-5 flex items-center gap-3 justify-end">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0"
                  style={{ borderColor: "var(--accent)" }}
                >
                  <img
                    src={profilePicUrl}
                    alt="Current profile"
                    className="w-full h-full object-cover"
                    key={profilePicUrl}
                  />
                </div>
                <input
                  ref={profilePicFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleProfilePicUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => profilePicFileRef.current?.click()}
                  disabled={profilePicUploading}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] flex items-center gap-1.5 shrink-0"
                  style={{
                    background: profilePicUploading
                      ? "var(--bg-secondary)"
                      : "var(--accent)",
                    borderColor: profilePicUploading
                      ? "var(--border)"
                      : "var(--accent)",
                    color: profilePicUploading
                      ? "var(--text-secondary)"
                      : "var(--bg-primary)",
                  }}
                >
                  <Upload size={12} />{" "}
                  {profilePicUploading ? "Uploading..." : "Upload"}
                </button>
                <button
                  onClick={handleProfilePicReset}
                  disabled={profilePicResetting}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] flex items-center gap-1.5 shrink-0"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <RotateCcw size={12} />{" "}
                  {profilePicResetting ? "..." : "Reset"}
                </button>
              </div>
              {profilePicMsg && (
                <div className="md:col-span-12 -mt-2">
                  <p
                    className="text-xs font-medium"
                    style={{
                      color:
                        profilePicMsg.type === "ok"
                          ? "#10b981"
                          : "#ef4444",
                    }}
                  >
                    {profilePicMsg.text}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Group: Blog Feed */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-dim)" }}
            >
              <BookOpen size={14} style={{ color: "var(--accent)" }} />
            </div>
            <h4
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Blog Feed
            </h4>
          </div>

          <div className="grid gap-4">
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-7 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Featured Blog Post
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Pin a published article to the hero slot on{" "}
                  <code className="text-[10px]">/blogs</code>.
                </p>
              </div>
              <div className="md:col-span-5 flex items-center gap-2 justify-end">
                <select
                  value={featuredSlug}
                  onChange={(e) => setFeaturedSlugLocal(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none cursor-pointer"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                >
                  <option value="">Latest Post (Default)</option>
                  {blogs
                    .filter((b) => b.published === 1)
                    .map((b) => (
                      <option key={b.id} value={b.slug}>
                        {b.title}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleFeaturedSave}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] shrink-0"
                  style={{
                    background: featuredSaved
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                    borderColor: featuredSaved
                      ? "var(--accent)"
                      : "var(--border)",
                    color: featuredSaved
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {featuredSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Group: Integrations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-dim)" }}
            >
              <Workflow size={14} style={{ color: "var(--accent)" }} />
            </div>
            <h4
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Integrations
            </h4>
          </div>

          <div className="grid gap-6">
            {/* PayPal */}
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-7 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  PayPal Donate URL
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Adds a donate button to every blog post. Leave blank
                  to hide.
                </p>
              </div>
              <div className="md:col-span-5 flex items-center justify-end gap-2">
                <input
                  type="url"
                  placeholder="https://paypal.me/yourname"
                  value={paypalDonateUrl}
                  onChange={(e) => setPaypalDonateUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                />
                <button
                  onClick={handlePaypalSave}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] shrink-0"
                  style={{
                    background: paypalSaved
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                    borderColor: paypalSaved
                      ? "var(--accent)"
                      : "var(--border)",
                    color: paypalSaved
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {paypalSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
            </div>

            {/* AI Provider */}
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-7 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  AI Provider
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Choose between Gemini (server-side) or Puter
                  (client-side, free).
                </p>
              </div>
              <div className="md:col-span-5 flex items-center justify-end gap-2">
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                >
                  <option value="gemini">Gemini (Server-side)</option>
                  <option value="puter">
                    Puter (Client-side, Free)
                  </option>
                </select>
                <button
                  onClick={handleProviderSave}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] shrink-0"
                  style={{
                    background: aiProviderSaved
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                    borderColor: aiProviderSaved
                      ? "var(--accent)"
                      : "var(--border)",
                    color: aiProviderSaved
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {aiProviderSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
            </div>

            {/* AI Model */}
            <div
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="md:col-span-7 space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  AI Default Model
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Model used for AI Compose, Blog Helper, and
                  cross-posts.
                </p>
              </div>
              <div className="md:col-span-5 flex items-center justify-end gap-2">
                <select
                  value={defaultAiModel}
                  onChange={(e) => setDefaultAiModel(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                >
                  {(
                    aiProvidersConfig[aiProvider]?.freeModels ||
                    aiModels
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  {aiModels.length === 0 &&
                    (!aiProvidersConfig[aiProvider] ||
                      !aiProvidersConfig[aiProvider]?.freeModels
                        ?.length) && (
                      <>
                        <option value="gemini-2.5-flash">
                          Gemini 2.5 Flash
                        </option>
                        <option value="gemini-2.0-flash">
                          Gemini 2.0 Flash
                        </option>
                        <option value="gemini-1.5-flash">
                          Gemini 1.5 Flash
                        </option>
                        <option value="gemini-1.5-pro">
                          Gemini 1.5 Pro
                        </option>
                      </>
                    )}
                </select>
                <button
                  onClick={handleDevtoModelSave}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] shrink-0"
                  style={{
                    background: defaultAiModelSaved
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                    borderColor: defaultAiModelSaved
                      ? "var(--accent)"
                      : "var(--border)",
                    color: defaultAiModelSaved
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {defaultAiModelSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
            </div>

            {/* Dev.to */}
            <div
              className="p-4 rounded-xl border bg-white/[0.01] space-y-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <BookOpen
                  size={16}
                  style={{ color: "var(--accent)" }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Dev.to Cross-Post
                </p>
              </div>
              <p
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Configure API access to auto-post blog summaries to
                Dev.to.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    API Key
                  </label>
                  <input
                    type="password"
                    placeholder="devto_..."
                    value={devtoApiKey}
                    onChange={(e) => setDevtoApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border)",
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="your-devto-username"
                    value={devtoUsername}
                    onChange={(e) => setDevtoUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border)",
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleDevtoSettingsSave}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98]"
                  style={{
                    background: devtoSaved
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                    borderColor: devtoSaved
                      ? "var(--accent)"
                      : "var(--border)",
                    color: devtoSaved
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {devtoSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
            </div>

            {/* n8n */}
            <div
              className="p-4 rounded-xl border bg-white/[0.01] space-y-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Workflow
                  size={16}
                  style={{ color: "var(--accent)" }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  n8n Integration
                </p>
              </div>
              <p
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Credentials for n8n to sync blogs to Dev.to
                automatically.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Portfolio Admin API Token
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 px-3 py-2 rounded-lg text-sm border flex items-center"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: tokenExists
                          ? "rgba(16, 185, 129, 0.3)"
                          : "var(--border)",
                      }}
                    >
                      {tokenExists ? (
                        <>
                          <CheckCircle2
                            size={12}
                            style={{ color: "#10b981" }}
                            className="mr-2 shrink-0"
                          />
                          <span
                            className="truncate"
                            style={{ color: "#10b981" }}
                          >
                            Token generated and active
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock
                            size={12}
                            style={{ color: "var(--text-muted)" }}
                            className="mr-2 shrink-0"
                          />
                          <span style={{ color: "var(--text-muted)" }}>
                            No token generated yet
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={handleGenerateToken}
                      disabled={generatingToken}
                      className="px-3 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] shrink-0"
                      style={{
                        background: tokenExists
                          ? "var(--bg-secondary)"
                          : "var(--accent)",
                        borderColor: tokenExists
                          ? "var(--border)"
                          : "var(--accent)",
                        color: tokenExists
                          ? "var(--text-secondary)"
                          : "var(--bg-primary)",
                      }}
                    >
                      {generatingToken
                        ? "Generating..."
                        : tokenExists
                          ? "Regenerate"
                          : "Generate"}
                    </button>
                    {tokenExists && (
                      <button
                        onClick={handleRevokeToken}
                        className="px-3 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] shrink-0"
                        style={{
                          background: "var(--bg-secondary)",
                          borderColor: "rgba(239, 68, 68, 0.3)",
                          color: "#ef4444",
                        }}
                        title="Revoke current token"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Required for n8n to access the portfolio API.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Or Paste Existing Token (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Paste a token from another source"
                    value={n8nPortfolioKey}
                    onChange={(e) => setN8nPortfolioKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border)",
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Dev.to API Key (for n8n)
                  </label>
                  <input
                    type="password"
                    placeholder="Same as Dev.to API key or separate key"
                    value={n8nDevtoKey}
                    onChange={(e) => setN8nDevtoKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border)",
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    n8n Webhook URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    value={n8nWebhookUrl}
                    onChange={(e) => setN8nWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border)",
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 items-center flex-wrap">
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {getRequiredFieldsFilled()
                    ? "✓ All required fields filled"
                    : "⚠ Required fields missing"}
                </span>
                <button
                  onClick={handleDownloadWorkflow}
                  disabled={!getRequiredFieldsFilled() || downloading}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] flex items-center gap-2"
                  style={{
                    background: getRequiredFieldsFilled()
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                    borderColor: getRequiredFieldsFilled()
                      ? "var(--accent)"
                      : "var(--border)",
                    color: getRequiredFieldsFilled()
                      ? "var(--bg-primary)"
                      : "var(--text-muted)",
                    opacity:
                      !getRequiredFieldsFilled() || downloading
                        ? 0.5
                        : 1,
                    cursor: !getRequiredFieldsFilled()
                      ? "not-allowed"
                      : "pointer",
                  }}
                  title={
                    getRequiredFieldsFilled()
                      ? "Download workflow.json"
                      : "Fill required fields first"
                  }
                >
                  <Download
                    size={12}
                    className={downloading ? "animate-pulse" : ""}
                  />
                  {downloading ? "Downloading…" : "Download Workflow"}
                </button>
                <button
                  onClick={handleN8nSave}
                  className="px-4 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98]"
                  style={{
                    background: n8nSaved
                      ? "var(--accent)"
                      : "var(--bg-secondary)",
                    borderColor: n8nSaved
                      ? "var(--accent)"
                      : "var(--border)",
                    color: n8nSaved
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {n8nSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Group: Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-dim)" }}
            >
              <Activity size={14} style={{ color: "var(--accent)" }} />
            </div>
            <h4
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Sync Status
            </h4>
          </div>

          <div
            className="p-4 rounded-xl border bg-white/[0.01] space-y-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-end">
              <button
                onClick={loadDevtoStatus}
                disabled={devtoStatusLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.98]"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                <RefreshCw
                  size={12}
                  className={devtoStatusLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {devtoStatusLoading && devtoStatus.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
              </div>
            ) : devtoStatus.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>
                No published blogs found.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      <th className="text-left p-2.5 font-medium" style={{ color: "var(--text-muted)" }}>Title</th>
                      <th className="text-left p-2.5 font-medium hidden md:table-cell" style={{ color: "var(--text-muted)" }}>Slug</th>
                      <th className="text-left p-2.5 font-medium hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Date</th>
                      <th className="text-right p-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devtoStatus.map((blog: any) => (
                      <tr key={blog.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                        <td className="p-2.5 truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>
                          {blog.title}
                        </td>
                        <td className="p-2.5 truncate max-w-[120px] hidden md:table-cell" style={{ color: "var(--text-muted)" }}>
                          {blog.slug}
                        </td>
                        <td className="p-2.5 whitespace-nowrap hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>
                          {new Date(blog.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-2.5 text-right">
                          {blog.devto_posted ? (
                            <a
                              href={`https://dev.to/${devtoUsername || "dev"}/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all hover:brightness-110"
                              style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                borderColor: "rgba(16, 185, 129, 0.3)",
                                color: "#10b981",
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Posted
                            </a>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border"
                              style={{
                                background: "rgba(245, 158, 11, 0.1)",
                                borderColor: "rgba(245, 158, 11, 0.3)",
                                color: "#f59e0b",
                              }}
                            >
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="font-semibold">{devtoStatus.filter((b: any) => b.devto_posted).length}</span> posted
              <span className="opacity-30">·</span>
              <span className="font-semibold">{devtoStatus.filter((b: any) => !b.devto_posted).length}</span> pending
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

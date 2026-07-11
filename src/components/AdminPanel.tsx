import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { queryClient } from "../lib/queryClient";
import { parseMarkdown, MermaidRenderer } from "../utils/markdown";
import Interactive3DBlock from "./Interactive3DBlock";
import InteractiveBlock from "./InteractiveBlock";
import ChartBlock from "./ChartBlock";
import { ACCENT_THEMES } from "../data/accents";
import { useMarkdownInsert } from "./MarkdownEditor";
import {
  uploadProfilePic,
  resetProfilePic,
  useProfilePic,
} from "../utils/profilePic";
import { getSafeItem, setSafeItem, removeSafeItem } from "../utils/storage";
import { getApiUrl } from "../utils/api";
import { slugify } from "../utils/format";
import type { Blog, Comment, Message } from "../types/blog";
import InlinePreviewTabs from "./admin/InlinePreviewTabs";
import LoginView from "./admin/LoginView";
import MessagesTab from "./admin/MessagesTab";
import { processUAStats, processCountryStats } from "./admin/helpers";
import AnalyticsTab from "./admin/AnalyticsTab";
import BlogsTab from "./admin/BlogsTab";
import SettingsTab from "./admin/SettingsTab";
import { AuditLogsTab } from "./admin/AuditLogsTab";
import DashboardHeader from "./admin/DashboardHeader";
import FocusModeOverlay from "./admin/FocusModeOverlay";
import { loadPuter } from "../utils/loadPuter";
import ProjectsTab from "./admin/ProjectsTab";
import SkillsTab from "./admin/SkillsTab";
import AboutTab from "./admin/AboutTab";
import ExperienceTab from "./admin/ExperienceTab";
import AwardsTab from "./admin/AwardsTab";

import { useGlobalTheme } from "../hooks/useGlobalTheme";

function AdminPanel() {
  const { theme, accent } = useGlobalTheme();
  const [token, setToken] = useState<string | null>(getSafeItem("admin_token"));
  const [password, setPassword] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Dashboard Tab selection (persisted across refresh)
  const [activeTab, setActiveTabState] = useState<
    "messages" | "blogs" | "analytics" | "audit" | "settings" | "projects" | "skills" | "about" | "experience" | "awards"
  >(() => {
    try {
      const saved = localStorage.getItem("admin_active_tab");
      if (
        saved === "messages" ||
        saved === "blogs" ||
        saved === "analytics" ||
        saved === "audit" ||
        saved === "settings" ||
        saved === "projects" ||
        saved === "skills"
      ) {
        return saved;
      }
    } catch {}
    return "messages";
  });

  const setActiveTab = (
    tab: "messages" | "blogs" | "analytics" | "audit" | "settings" | "projects" | "skills" | "about" | "experience" | "awards",
  ) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem("admin_active_tab", tab);
    } catch {}
  };

  // ── Tab 1: Messages State ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unreplied" | "replied">(
    "all",
  );
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModels, setAiModels] = useState<string[]>([]);
  const [defaultAiModel, setDefaultAiModel] = useState("gemini-2.5-flash");
  const [defaultAiModelSaved, setDefaultAiModelSaved] =
    useState<boolean>(false);
  const [aiProvider, setAiProvider] = useState<string>("gemini");
  const [aiProvidersConfig, setAiProvidersConfig] = useState<
    Record<
      string,
      {
        name: string;
        defaultModel: string;
        freeModels: string[];
        requiresApiKey: boolean;
        apiKeyEnv?: string;
      }
    >
  >({});
  const [aiProviderSaved, setAiProviderSaved] = useState<boolean>(false);

  // ── Tab 2: Blogs State ──
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [blogSearchQuery, setBlogSearchQuery] = useState("");
  const [blogFilterTab, setBlogFilterTab] = useState<
    "all" | "drafts" | "published"
  >("all");

  const blogWords = useMemo(() => {
    const wordSet = new Set<string>();
    for (const blog of blogs) {
      const matches =
        (blog.title + " " + blog.content + " " + (blog.summary || "")).match(
          /[a-zA-Z]{3,}/g,
        ) || [];
      for (const m of matches) wordSet.add(m);
    }
    return Array.from(wordSet);
  }, [blogs]);

  // Blog Form Fields
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogSummary, setBlogSummary] = useState("");
  const [blogTags, setBlogTags] = useState("");
  const [blogCategory, setBlogCategory] = useState("General");
  const [blogPublished, setBlogPublished] = useState(false);
  const [blogReadTime, setBlogReadTime] = useState("");
  const [blogCoverImage, setBlogCoverImage] = useState("");
  const [blogDevtoSummary, setBlogDevtoSummary] = useState("");
  const [blogSocialSummary, setBlogSocialSummary] = useState("");
  const [blogSummaryLoading, setBlogSummaryLoading] = useState(false);
  const [blogSocialLoading, setBlogSocialLoading] = useState(false);
  const [blogSummaryCached, setBlogSummaryCached] = useState(false);
  const [blogSocialCached, setBlogSocialCached] = useState(false);
  const [summarizerProvider, setSummarizerProvider] = useState("");
  const [summarizerModel, setSummarizerModel] = useState("");
  const [blogComments, setBlogComments] = useState<Comment[]>([]);

  // Collapse State
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [isAiCopilotExpanded, setIsAiCopilotExpanded] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

  const [blogEditorTab, setBlogEditorTab] = useState<"edit" | "preview" | "summarizer">(
    "edit",
  );
  const [isNewBlog, setIsNewBlog] = useState(false);
  const [blogAiPrompt, setBlogAiPrompt] = useState("");
  const [blogAiLoading, setBlogAiLoading] = useState(false);
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogDeleting, setBlogDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [commentDeletingId, setCommentDeletingId] = useState<string | null>(
    null,
  );

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    try {
      const res = await api("/api/admin/upload", {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setBlogCoverImage(data.url);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };
  const [focusContentMode, setFocusContentMode] = useState(false);
  const { setEditor: setMonacoEditor } = useMarkdownInsert();
  const parsedBlogContent = useMemo(
    () => (blogContent ? parseMarkdown(blogContent) : null),
    [blogContent],
  );

  // ── Zoom Modal State ──
  const [zoomedBlock, setZoomedBlock] = useState<{
    type: string;
    code: string;
    startLine: number;
    endLine: number;
  } | null>(null);
  const [zoomedCode, setZoomedCode] = useState("");
  const [debouncedZoomedCode, setDebouncedZoomedCode] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedZoomedCode(zoomedCode), 800);
    return () => clearTimeout(timer);
  }, [zoomedCode]);

  useEffect(() => {
    if (zoomedBlock) {
      setZoomedCode(zoomedBlock.code);
      document.body.style.overflow = "hidden";
    } else if (!focusContentMode) {
      document.body.style.overflow = "";
    }
  }, [zoomedBlock, focusContentMode]);

  const applyZoomedChanges = useCallback(() => {
    if (!zoomedBlock) return;
    
    const lines = blogContent.split('\n');
    const before = lines.slice(0, zoomedBlock.startLine);
    const after = lines.slice(zoomedBlock.endLine - 1);
    
    const newContent = [...before, zoomedCode, ...after].join('\n');
    setBlogContent(newContent);
    setZoomedBlock(null);
  }, [zoomedBlock, zoomedCode, blogContent]);

  // ── Console State ──
  const [previewSubTab, setPreviewSubTab] = useState<"render" | "console">("render");
  const [previewLogs, setPreviewLogs] = useState<{ id: string; type: string; msg: string; time: string }[]>([]);
  const [fixingErrorId, setFixingErrorId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});

  const handleAskAiFix = async (logId: string, errorMsg: string) => {
    setFixingErrorId(logId);
    try {
      await loadPuter()
      if ((window as any).puter?.ai?.chat) {
        const prompt = `I got this error in my custom React/Markdown block editor:\n\nError: ${errorMsg}\n\nHere is my current markdown content:\n\n${blogContent}\n\nPlease tell me exactly what to change in the markdown to fix this error. Keep it brief.`;
        const aiResult: any = await (window as any).puter.ai.chat(prompt);
        const suggestion = typeof aiResult === "string" ? aiResult : String(aiResult);
        setAiSuggestions(prev => ({ ...prev, [logId]: suggestion }));
      } else {
        setAiSuggestions(prev => ({ ...prev, [logId]: "Puter AI is not available. Please check the markdown syntax manually." }));
      }
    } catch (err) {
      setAiSuggestions(prev => ({ ...prev, [logId]: "Failed to get AI suggestion. Try again later." }));
    } finally {
      setFixingErrorId(null);
    }
  };

  const renderInlinePreview = useCallback(
    (type: string, code: string, _id: string) => {
      let content;
      switch (type) {
        case "mermaid":
          content = <MermaidRenderer code={code} />;
          break;
        case "interactive-3d":
          content = <Interactive3DBlock html={code} />;
          break;
        case "interactive":
          content = <InteractiveBlock html={code} />;
          break;
        case "chart":
          content = <ChartBlock code={code} />;
          break;
        default:
          content = (
            <div className="p-4 text-center text-[var(--text-secondary)]">
              Preview for '{type}' is not supported.
            </div>
          );
      }

      return (
        <InlinePreviewTabs
          content={content}
          previewLogs={previewLogs}
          setPreviewLogs={setPreviewLogs}
          handleAskAiFix={handleAskAiFix}
          fixingErrorId={fixingErrorId}
          aiSuggestions={aiSuggestions}
        />
      );
    },
    [theme, accent, previewLogs, fixingErrorId, aiSuggestions],
  );

  useEffect(() => {
    if (blogEditorTab !== "preview" && blogEditorTab !== "edit") return;

    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    const pushLog = (type: string, args: any[]) => {
      const msg = args.map(a => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ");
      const time = new Date().toLocaleTimeString();
      const id = Math.random().toString(36).substring(7);
      setPreviewLogs(prev => [...prev, { id, type, msg, time }]);
    };

    console.error = (...args) => {
      pushLog("error", args);
      originalError.apply(console, args);
    };
    console.warn = (...args) => {
      pushLog("warn", args);
      originalWarn.apply(console, args);
    };
    console.log = (...args) => {
      pushLog("log", args);
      originalLog.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, [blogEditorTab]);

  useEffect(() => {
    if (focusContentMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [focusContentMode]);

  // Preload Puter AI script on mount (lazy-loaded, non-blocking)
  useEffect(() => {
    loadPuter().catch(() => {})
  }, []);

  // ── Visitor Analytics State ──
  const [visitors, setVisitors] = useState<any[]>([]);
  const [dailyVisits, setDailyVisits] = useState<any[]>([]);
  const [hourlyVisits, setHourlyVisits] = useState<any[]>([]);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorRefreshing, setVisitorRefreshing] = useState(false);
  const [unfilteredTotal, setUnfilteredTotal] = useState(0);
  const [unfilteredVisits, setUnfilteredVisits] = useState(0);

  // ── Cleanup State ──
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupFrom, setCleanupFrom] = useState("");
  const [cleanupTo, setCleanupTo] = useState("");

  const manilaDateStr = (d: Date) => {
    const ph = new Date(d.getTime() + 8 * 60 * 60 * 1000)
    return ph.toISOString().slice(0, 10)
  }

  const [cleanupTables, setCleanupTables] = useState<string[]>([
    "daily",
    "hourly",
  ]);
  const [cleanupPreview, setCleanupPreview] = useState<{
    daily: number;
    hourly: number;
    visitors: number;
  } | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [cleanupConfirm, setCleanupConfirm] = useState(false);

  // ── Grid State (pagination, sort, search, filters) ──
  const [gridPage, setGridPage] = useState(1);
  const [gridLimit, setGridLimit] = useState(20);
  const [gridSort, setGridSort] = useState("last_visit");
  const [gridOrder, setGridOrder] = useState<"asc" | "desc">("desc");
  const [gridSearch, setGridSearch] = useState("");
  const [gridCountry, setGridCountry] = useState("");
  const [gridShowHumansOnly, setGridShowHumansOnly] = useState(false);
  const [gridStartDate, setGridStartDate] = useState("");
  const [gridEndDate, setGridEndDate] = useState("");
  const [gridGroupByCountry, setGridGroupByCountry] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
  const [topPages, setTopPages] = useState<any[]>([]);
  const [topPagesLoading, setTopPagesLoading] = useState(false);
  const [gridPagination, setGridPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [gridCountries, setGridCountries] = useState<string[]>([]);
  const visitorsLoadedRef = useRef(false);

  const countryStats = useMemo(() => processCountryStats(visitors), [visitors]);
  const uaStats = useMemo(() => processUAStats(visitors), [visitors]);
  const deviceTotal = useMemo(
    () =>
      Object.values(uaStats.deviceCount).reduce((s, v) => s + (v as number), 0),
    [uaStats],
  );
  const browserTotal = useMemo(
    () =>
      Object.values(uaStats.browserCount).reduce(
        (s, v) => s + (v as number),
        0,
      ),
    [uaStats],
  );

  // Analytics summary (avoid recomputation in JSX)
  const todayStr = useMemo(() => manilaDateStr(new Date()), []);
  const yesterdayDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return manilaDateStr(d);
  }, []);
  const todayCount = useMemo(
    () => dailyVisits.find((d: any) => d.date === todayStr)?.count || 0,
    [dailyVisits, todayStr],
  );
  const yesterdayCount = useMemo(
    () => dailyVisits.find((d: any) => d.date === yesterdayDate)?.count || 0,
    [dailyVisits, yesterdayDate],
  );

  // Chart data (avoid spread/reverse/slice on every render)
  const dailyChartData = useMemo(
    () => dailyVisits.slice(0, 14).reverse(),
    [dailyVisits],
  );
  const hourlyChartData = useMemo(
    () => [...hourlyVisits].reverse().slice(-24),
    [hourlyVisits],
  );

  // Sorted bar chart entries (avoid sort on every render)
  const sortedDevices = useMemo(
    () =>
      Object.entries(uaStats.deviceCount).sort((a: any, b: any) => b[1] - a[1]),
    [uaStats],
  );
  const sortedBrowsers = useMemo(
    () =>
      Object.entries(uaStats.browserCount).sort(
        (a: any, b: any) => b[1] - a[1],
      ),
    [uaStats],
  );

  // Max country count (avoid Math.max inside .map())
  const maxCountryCount = useMemo(
    () => Math.max(...countryStats.slice(0, 8).map((x) => x.count), 1),
    [countryStats],
  );

  // Pagination pages (avoid IIFE in JSX)
  const paginationPages = useMemo(() => {
    const current = gridPagination.page;
    const total = gridPagination.totalPages;
    const pages: (number | "...")[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push("...");
      pages.push(total);
    }
    return pages;
  }, [gridPagination.page, gridPagination.totalPages]);

  // ── Tab 3: System Settings State ──
  const [defaultTheme, setDefaultTheme] = useState<"dark" | "light" | null>(
    () => {
      const saved = getSafeItem("default_theme");
      return saved === "light" || saved === "dark" ? saved : null;
    },
  );
  const [defaultAccent, setDefaultAccent] = useState<string | null>(() => {
    const saved = getSafeItem("default_accent");
    return saved && saved in ACCENT_THEMES ? saved : null;
  });
  const [paypalDonateUrl, setPaypalDonateUrl] = useState<string>("");
  const [paypalSaved, setPaypalSaved] = useState<boolean>(false);

  const loadPaypalUrl = useCallback(async () => {
    try {
      const res = await api("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setPaypalDonateUrl(data?.paypal_donate_url || "");
        setDefaultAiModel(data?.default_ai_model || "gemini-2.5-flash");
      }
    } catch {}
  }, []);

  const handlePaypalSave = async () => {
    await saveSettings({ paypal_donate_url: paypalDonateUrl.trim() });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    setPaypalSaved(true);
    setTimeout(() => setPaypalSaved(false), 1500);
    try {
      sessionStorage.setItem("paypal_donate_url", paypalDonateUrl.trim());
    } catch {}
  };

  const handleDevtoModelSave = async () => {
    await saveSettings({ default_ai_model: defaultAiModel });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    setDefaultAiModelSaved(true);
    setTimeout(() => setDefaultAiModelSaved(false), 1500);
  };

  const handleProviderSave = async () => {
    await saveSettings({ ai_provider: aiProvider });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    setAiProviderSaved(true);
    setTimeout(() => setAiProviderSaved(false), 1500);
  };

  // ── n8n Integration Settings ──
  const [n8nPortfolioKey, setN8nPortfolioKey] = useState("");
  const [n8nDevtoKey, setN8nDevtoKey] = useState("");
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [n8nSaved, setN8nSaved] = useState(false);

  // ── Dev.to Settings ──
  const [devtoApiKey, setDevtoApiKey] = useState("");
  const [devtoUsername, setDevtoUsername] = useState("");
  const [devtoSaved, setDevtoSaved] = useState(false);
  const [devtoStatus, setDevtoStatus] = useState<any[]>([]);
  const [devtoStatusLoading, setDevtoStatusLoading] = useState(false);



  // ── Profile Pic Settings ──
  const { url: profilePicUrl, refresh: refreshProfilePic } = useProfilePic();
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [profilePicResetting, setProfilePicResetting] = useState(false);
  const [profilePicMsg, setProfilePicMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const profilePicFileRef = useRef<HTMLInputElement>(null);

  // ── Featured Blog Settings ──
  const [featuredSlug, setFeaturedSlugLocal] = useState<string>("");
  const [featuredSaved, setFeaturedSaved] = useState(false);

  const handleProfilePicUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicMsg(null);
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      setProfilePicMsg({
        type: "err",
        text: "Only PNG, JPG, WEBP, or GIF allowed",
      });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setProfilePicMsg({ type: "err", text: "Image exceeds 4MB" });
      return;
    }
    try {
      setProfilePicUploading(true);
      await uploadProfilePic(file);
      await refreshProfilePic();
      setProfilePicMsg({
        type: "ok",
        text: "Profile picture updated everywhere",
      });
      setTimeout(() => setProfilePicMsg(null), 2500);
    } catch (err) {
      setProfilePicMsg({
        type: "err",
        text: (err as Error).message || "Upload failed",
      });
    } finally {
      setProfilePicUploading(false);
      if (profilePicFileRef.current) profilePicFileRef.current.value = "";
    }
  };

  const handleProfilePicReset = async () => {
    try {
      setProfilePicResetting(true);
      setProfilePicMsg(null);
      await resetProfilePic();
      await refreshProfilePic();
      setProfilePicMsg({
        type: "ok",
        text: "Profile picture reset to default",
      });
      setTimeout(() => setProfilePicMsg(null), 2500);
    } catch (err) {
      setProfilePicMsg({
        type: "err",
        text: (err as Error).message || "Reset failed",
      });
    } finally {
      setProfilePicResetting(false);
    }
  };

  const loadN8nSettings = useCallback(async () => {
    try {
      const res = await api("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setN8nPortfolioKey(data?.n8n_portfolio_api_key || "");
        setN8nDevtoKey(data?.n8n_devto_api_key || "");
        setN8nWebhookUrl(data?.n8n_webhook_url || "");
        setDevtoApiKey(data?.devto_api_key || "");
        setDevtoUsername(data?.devto_username || "");
        setFeaturedSlugLocal(data?.featured_blog_slug || "");
      }
    } catch {}
  }, []);

  const handleFeaturedSave = async () => {
    await saveSettings({ featured_blog_slug: featuredSlug.trim() });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    setFeaturedSaved(true);
    setTimeout(() => setFeaturedSaved(false), 1500);
  };

  const loadTokenStatus = useCallback(async () => {
    try {
      const res = await api("/api/admin/token-exists");
      if (res.ok) {
        const data = await res.json();
        setTokenExists(!!data.exists);
      }
    } catch {}
  }, []);

  const loadDevtoStatus = useCallback(async () => {
    try {
      setDevtoStatusLoading(true);
      const res = await api("/api/admin/blogs/devto-status");
      if (res.ok) {
        const data = await res.json();
        setDevtoStatus(data);
      }
    } catch {
    } finally {
      setDevtoStatusLoading(false);
    }
  }, []);

  const handleN8nSave = async () => {
    await saveSettings({
      n8n_portfolio_api_key: n8nPortfolioKey.trim(),
      n8n_devto_api_key: n8nDevtoKey.trim(),
      n8n_webhook_url: n8nWebhookUrl.trim(),
    });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    setN8nSaved(true);
    setTimeout(() => setN8nSaved(false), 1500);
  };

  // ── Token generation ──
  const [generatingToken, setGeneratingToken] = useState(false);

  const handleGenerateToken = async () => {
    try {
      setGeneratingToken(true);
      const res = await api("/api/admin/generate-token", { method: "POST" });
      if (res.ok) {
        await loadTokenStatus();
      }
    } catch (err) {
      console.error("Generate token error:", err);
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!confirm("Revoke current API token? n8n will lose access.")) return;
    try {
      await api("/api/admin/revoke-token", { method: "POST" });
      await loadTokenStatus();
    } catch (err) {
      console.error("Revoke token error:", err);
    }
  };

  // ── n8n Workflow Download ──
  const [downloading, setDownloading] = useState(false);
  const [tokenExists, setTokenExists] = useState<boolean>(false);

  // Required fields: API token generated, Dev.to API key, Dev.to username
  const getRequiredFieldsFilled = () => {
    return (
      tokenExists &&
      devtoApiKey.trim().length > 0 &&
      devtoUsername.trim().length > 0
    );
  };

  const handleDownloadWorkflow = async () => {
    if (!getRequiredFieldsFilled()) return;
    try {
      setDownloading(true);
      const tokenSession = token || sessionStorage.getItem("admin_token") || "";
      const baseUrl =
        window.location.hostname === "localhost" &&
        window.location.port === "5173"
          ? "http://localhost:3000"
          : "";
      const res = await fetch(`${baseUrl}/api/admin/n8n-workflow-download`, {
        headers: { Authorization: `Bearer ${tokenSession}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "portfolio-devto-workflow.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert(`Failed to generate workflow: ${(err as Error).message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDevtoSettingsSave = async () => {
    await saveSettings({
      devto_api_key: devtoApiKey.trim(),
      devto_username: devtoUsername.trim(),
    });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    setDevtoSaved(true);
    setTimeout(() => setDevtoSaved(false), 1500);
  };

  useEffect(() => {
    if (activeTab === "settings") {
      loadPaypalUrl();
      loadN8nSettings();
      loadDevtoStatus();
      loadTokenStatus();
    }
  }, [
    activeTab,
    loadPaypalUrl,
    loadN8nSettings,
    loadDevtoStatus,
    loadTokenStatus,
  ]);
  const [rotationThemeEnabled, setRotationThemeEnabled] = useState(() => {
    return getSafeItem("rotation_theme_enabled") !== "false";
  });
  const [rotationAccentEnabled, setRotationAccentEnabled] = useState(() => {
    return getSafeItem("rotation_accent_enabled") === "true";
  });
  const [rotationIntervalHours, setRotationIntervalHours] = useState(() => {
    return Number(getSafeItem("rotation_interval_hours") || "2");
  });
  const [cursorEnabled, setCursorEnabled] = useState(() => {
    return getSafeItem("cursor_enabled") !== "false";
  });

  const toggleCursor = async () => {
    const nextVal = !cursorEnabled;
    setCursorEnabled(nextVal);
    setSafeItem("cursor_enabled", String(nextVal));
    document.documentElement.dataset.cursorEnabled = nextVal ? "true" : "false";
    window.dispatchEvent(new CustomEvent("cursor-state-changed", { detail: { enabled: nextVal } }));
    await saveSettings({ cursor_enabled: String(nextVal) });
  };

  const saveSettings = async (updates: Record<string, string>) => {
    try {
      await api("/api/settings", {
        method: "POST",
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  const toggleRotationTheme = async () => {
    const nextVal = !rotationThemeEnabled;
    setRotationThemeEnabled(nextVal);
    setSafeItem("rotation_theme_enabled", String(nextVal));
    if (nextVal) {
      removeSafeItem("theme");
    }
    await saveSettings({
      rotation_theme_enabled: String(nextVal),
      ...(nextVal ? { theme: "" } : {}),
    });
  };

  const toggleRotationAccent = async () => {
    const nextVal = !rotationAccentEnabled;
    setRotationAccentEnabled(nextVal);
    setSafeItem("rotation_accent_enabled", String(nextVal));
    if (nextVal) {
      removeSafeItem("accent");
    }
    await saveSettings({
      rotation_accent_enabled: String(nextVal),
      ...(nextVal ? { accent: "" } : {}),
    });
  };

  const handleIntervalChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = Math.max(1, Math.min(24, Number(e.target.value) || 2));
    setRotationIntervalHours(val);
    setSafeItem("rotation_interval_hours", String(val));
    await saveSettings({ rotation_interval_hours: String(val) });
  };

  const groupedVisitors = useMemo(() => {
    if (!gridGroupByCountry) return null;
    const groups: Record<string, any[]> = {};
    visitors.forEach((v: any) => {
      const key = v.country || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [visitors, gridGroupByCountry]);

  useEffect(() => {
    if (gridGroupByCountry && groupedVisitors) {
      setExpandedCountries(
        Object.fromEntries(groupedVisitors.map(([c]) => [c, true]))
      );
    }
  }, [gridGroupByCountry]);

  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => ({ ...prev, [country]: !prev[country] }));
  };

  const fetchVisitors = useCallback(async () => {
    if (!visitorsLoadedRef.current) { setVisitorLoading(true); setTopPagesLoading(true); }
    else { setVisitorRefreshing(true); setTopPagesLoading(true); }
    try {
      const params = new URLSearchParams();
      params.set("page", String(gridPage));
      params.set("limit", String(gridLimit));
      params.set("sort", gridSort);
      params.set("order", gridOrder);
      if (gridSearch) params.set("search", gridSearch);
      if (gridCountry) params.set("country", gridCountry);
      if (gridStartDate) params.set("startDate", gridStartDate);
      if (gridEndDate) params.set("endDate", gridEndDate);

      const [res, pagesRes] = await Promise.all([
        api(`/api/visitors?${params.toString()}`),
        api(`/api/visitors/pages?startDate=${gridStartDate}&endDate=${gridEndDate}`)
      ]);

      if (res.ok) {
        const data = await res.json();
        setVisitors(data.visitors || []);
        setDailyVisits(data.daily || []);
        setHourlyVisits(data.hourly || []);
        setGridPagination(
          data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
        );
        setGridCountries(data.countries || []);
        setUnfilteredTotal(data.unfiltered_total || 0);
        setUnfilteredVisits(data.unfiltered_visits || 0);
        visitorsLoadedRef.current = true;
      }
      
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        setTopPages(pagesData || []);
      }
    } catch (err) {
      console.error("Failed to fetch visitors:", err);
    } finally {
      setVisitorLoading(false);
      setVisitorRefreshing(false);
      setTopPagesLoading(false);
    }
  }, [gridPage, gridLimit, gridSort, gridOrder, gridSearch, gridCountry, gridShowHumansOnly, gridStartDate, gridEndDate]);

  const exportCSV = useCallback(async () => {
    try {
      const res = await api("/api/visitors/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "visitors.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("CSV export failed:", err);
    }
  }, []);

  const previewCleanup = useCallback(async () => {
    if (!cleanupFrom || !cleanupTo) return;
    setCleanupLoading(true);
    setCleanupPreview(null);
    try {
      const res = await api("/api/visitors/cleanup/preview", {
        method: "POST",
        body: JSON.stringify({ from: cleanupFrom, to: cleanupTo }),
      });
      if (res.ok) {
        const data = await res.json();
        setCleanupPreview(data);
      }
    } catch (err) {
      console.error("Cleanup preview failed:", err);
    } finally {
      setCleanupLoading(false);
    }
  }, [cleanupFrom, cleanupTo]);

  const executeCleanup = useCallback(async () => {
    if (!cleanupFrom || !cleanupTo || !cleanupConfirm) return;
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const res = await api("/api/visitors/cleanup", {
        method: "POST",
        body: JSON.stringify({
          from: cleanupFrom,
          to: cleanupTo,
          tables: cleanupTables,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { deleted: Record<string, number> };
        const parts = Object.entries(data.deleted)
          .filter(([_, v]) => v > 0)
          .map(([k, v]) => `${k}: ${v}`);
        setCleanupResult(
          parts.length > 0 ? `Deleted ${parts.join(", ")}` : "No rows matched",
        );
        setCleanupPreview(null);
        setCleanupConfirm(false);
        fetchVisitors();
      }
    } catch (err) {
      console.error("Cleanup failed:", err);
    } finally {
      setCleanupLoading(false);
    }
  }, [cleanupFrom, cleanupTo, cleanupTables, cleanupConfirm, fetchVisitors]);

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchVisitors();
    }
  }, [activeTab]); // only re-fetch on tab change, grid changes have their own effect

  useEffect(() => {
    if (activeTab === "settings") {
      loadDevtoStatus();
    }
  }, [activeTab, loadDevtoStatus]);

  // Single debounced fetch for all grid param changes
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridInitializedRef = useRef(false);
  const prevGridRef = useRef("");

  useEffect(() => {
    const key = `${gridPage}|${gridLimit}|${gridSort}|${gridOrder}|${gridSearch}|${gridCountry}`;
    if (!gridInitializedRef.current) {
      gridInitializedRef.current = true;
      prevGridRef.current = key;
      return;
    }
    if (prevGridRef.current === key) return;
    const prev = prevGridRef.current.split("|");
    prevGridRef.current = key;

    // Reset to page 1 when non-page params change
    const cur = key.split("|");
    const nonPageChanged =
      cur[1] !== prev[1] ||
      cur[2] !== prev[2] ||
      cur[3] !== prev[3] ||
      cur[4] !== prev[4] ||
      cur[5] !== prev[5];
    if (nonPageChanged && gridPage !== 1) {
      setGridPage(1);
      return; // the page change will re-trigger this effect
    }

    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(
      () => {
        fetchVisitors();
      },
      gridSearch ? 300 : 0,
    );

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [gridPage, gridLimit, gridSort, gridOrder, gridSearch, gridCountry]);

  const handleDefaultThemeChange = async (val: string) => {
    if (val === "dark" || val === "light") {
      setDefaultTheme(val);
      setSafeItem("default_theme", val);
      setRotationThemeEnabled(false);
      setSafeItem("rotation_theme_enabled", "false");
      await saveSettings({
        default_theme: val,
        rotation_theme_enabled: "false",
      });
    } else {
      setDefaultTheme(null);
      removeSafeItem("default_theme");
      setRotationThemeEnabled(true);
      setSafeItem("rotation_theme_enabled", "true");
      await saveSettings({ default_theme: "", rotation_theme_enabled: "true" });
    }
  };

  const handleDefaultAccentChange = async (val: string) => {
    if (val && val !== "auto") {
      setDefaultAccent(val);
      setSafeItem("default_accent", val);
      setRotationAccentEnabled(false);
      setSafeItem("rotation_accent_enabled", "false");
      await saveSettings({
        default_accent: val,
        rotation_accent_enabled: "false",
      });
    } else {
      setDefaultAccent(null);
      removeSafeItem("default_accent");
      setRotationAccentEnabled(true);
      setSafeItem("rotation_accent_enabled", "true");
      await saveSettings({
        default_accent: "",
        rotation_accent_enabled: "true",
      });
    }
  };

  const api = async (path: string, options?: RequestInit) => {
    return fetch(getApiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Invalid password");
      const data = await res.json();
      setSafeItem("admin_token", data.token);
      setToken(data.token);
    } catch {
      setLoginError("Invalid password");
    }
  };

  const handleLogout = () => {
    removeSafeItem("admin_token");
    setToken(null);
    setSelected(null);
    setMessages([]);
    setBlogs([]);
    setSelectedBlog(null);
  };

  const fetchMessages = async () => {
    try {
      const res = await api("/api/messages");
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const fetchBlogs = async () => {
    try {
      const res = await api("/api/admin/blogs");
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setBlogs(data);
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await api("/api/ai/providers");
      if (res.ok) {
        const data = await res.json();
        const provider = data.currentProvider || "gemini";
        setAiModels(data.providers?.[provider]?.freeModels || []);
      }
    } catch {}
  };

  const fetchProviders = async () => {
    try {
      const res = await api("/api/ai/providers");
      if (res.ok) {
        const data = await res.json();
        setAiProvider(data.currentProvider || "gemini");
        setAiProvidersConfig(data.providers || {});
      }
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await api("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.default_theme !== undefined) {
          const val = data.default_theme;
          if (val === "dark" || val === "light") {
            setDefaultTheme(val);
            setSafeItem("default_theme", val);
          } else {
            setDefaultTheme(null);
            removeSafeItem("default_theme");
          }
        }
        if (data.default_accent !== undefined) {
          const val = String(data.default_accent);
          if (val && val in ACCENT_THEMES) {
            setDefaultAccent(val);
            setSafeItem("default_accent", val);
          } else {
            setDefaultAccent(null);
            removeSafeItem("default_accent");
          }
        }
        if (data.rotation_theme_enabled !== undefined) {
          setRotationThemeEnabled(data.rotation_theme_enabled === "true");
        }
        if (data.rotation_accent_enabled !== undefined) {
          setRotationAccentEnabled(data.rotation_accent_enabled === "true");
        }
        if (data.rotation_interval_hours !== undefined) {
          setRotationIntervalHours(Number(data.rotation_interval_hours));
        }
        if (data.cursor_enabled !== undefined) {
          setCursorEnabled(data.cursor_enabled === "true");
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  useEffect(() => {
    if (token) {
      // Non-blocking: defer data fetches so login transition isn't blocked
      setTimeout(() => {
        fetchMessages();
        fetchBlogs();
      }, 0);
      setTimeout(() => {
        fetchModels();
        fetchSettings();
        fetchProviders();
      }, 50);
    }
  }, [token]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      if (activeTab === "messages") {
        await fetchMessages();
      } else if (activeTab === "blogs") {
        await fetchBlogs();
      } else if (activeTab === "analytics") {
        fetchVisitors();
      } else {
        await fetchSettings();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // ── Tab 1: Messages Handlers ──
  const handleSendReply = async () => {
    if (!selected || !replySubject || !replyBody) return;
    setSending(true);
    try {
      const res = await api("/api/reply", {
        method: "POST",
        body: JSON.stringify({
          messageId: selected.id,
          subject: replySubject,
          body: replyBody,
        }),
      });
      if (!res.ok) throw new Error("Failed to send reply");

      const updated = {
        ...selected,
        replied: 1,
        reply_subject: replySubject,
        reply_body: replyBody,
        replied_at: new Date().toISOString(),
      };
      setSelected(updated);
      setMessages((prev) =>
        prev.map((m) => (m.id === selected.id ? updated : m)),
      );
      setReplySubject("");
      setReplyBody("");
      setAiPrompt("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleAiCompose = async (customPrompt?: string) => {
    if (!selected) return;
    const promptText = customPrompt || aiPrompt;
    if (!promptText) return;

    setAiLoading(true);
    try {
      await loadPuter()
      if (aiProvider === "puter" && (window as any).puter?.ai) {
        const fullPrompt = `You are helping compose a professional email reply. Context:\nOriginal message from ${selected.name} (${selected.email}):\n${selected.message}\n\nInstructions: ${promptText}\n\nWrite the email reply body only (no subject line).`;
        const response = await (window as any).puter.ai.chat(fullPrompt, {
          model: defaultAiModel,
        });
        setReplyBody(
          typeof response === "string" ? response : String(response),
        );
      } else {
        const res = await api("/api/ai/compose", {
          method: "POST",
          body: JSON.stringify({
            prompt: promptText,
            model: defaultAiModel,
            context: `Original message from ${selected.name} (${selected.email}):\n${selected.message}`,
          }),
        });
        if (!res.ok) throw new Error("AI generation failed");
        const data = await res.json();
        setReplyBody(data.body);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await api(`/api/messages/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete message");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) {
        setSelected(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete message');
    }
  };

  // ── Tab 2: Blogs Handlers ──

  const handleBlogTitleChange = (val: string) => {
    setBlogTitle(val);
    if (isNewBlog) {
      setBlogSlug(slugify(val));
    }
  };

  const handleSelectBlog = async (blog: Blog) => {
    setIsNewBlog(false);
    setSelectedBlog(blog);
    setBlogTitle(blog.title);
    setBlogSlug(blog.slug);
    setBlogContent(blog.content);
    setBlogSummary(blog.summary || "");
    setBlogTags(blog.tags || "");
    setBlogCategory(blog.category || "General");
    setBlogPublished(blog.published === 1);
    setBlogReadTime(blog.read_time || "");
    setBlogCoverImage(blog.cover_image || "");
    setBlogDevtoSummary(blog.devto_summary || "");
    setBlogSocialSummary(blog.social_summary || "");
    setBlogSummaryCached(!!blog.devto_summary);
    setBlogSocialCached(!!blog.social_summary);
    setBlogEditorTab("edit");
    setBlogAiPrompt("");

    // Fetch comments for moderation
    try {
      const res = await api(`/api/blogs/${blog.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setBlogComments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewBlog = () => {
    setIsNewBlog(true);
    const tempId = `new-${Date.now()}`;
    const emptyBlog: Blog = {
      id: tempId,
      slug: "",
      title: "",
      content: "",
      summary: "",
      tags: "",
      category: "General",
      published: 0,
      likes: 0,
      read_time: "5 min read",
      cover_image: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSelectedBlog(emptyBlog);
    setBlogTitle("");
    setBlogSlug("");
    setBlogContent("");
    setBlogSummary("");
    setBlogTags("");
    setBlogCategory("General");
    setBlogPublished(false);
    setBlogReadTime("5 min read");
    setBlogCoverImage("");
    setBlogDevtoSummary("");
    setBlogSocialSummary("");
    setBlogSummaryCached(false);
    setBlogSocialCached(false);
    setBlogComments([]);
    setBlogEditorTab("edit");
    setBlogAiPrompt("");
  };

  const handleSaveBlog = async () => {
    if (!blogTitle || !blogSlug || !blogContent) return;
    setBlogSaving(true);

    const blogData = {
      title: blogTitle,
      slug: blogSlug,
      content: blogContent,
      summary: blogSummary,
      tags: blogTags,
      category: blogCategory,
      published: blogPublished ? 1 : 0,
      read_time: blogReadTime,
      cover_image: blogCoverImage,
    };

    try {
      if (isNewBlog) {
        const res = await api("/api/admin/blogs", {
          method: "POST",
          body: JSON.stringify(blogData),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to create blog post");
          return;
        }
        await res.json();
        setIsNewBlog(false);
        await fetchBlogs();
        queryClient.invalidateQueries({ queryKey: ['blogs'] });
        // Select the newly created blog by matching its slug
        const resBlogs = await api("/api/admin/blogs");
        const allBlogs = await resBlogs.json();
        const match = allBlogs.find((b: Blog) => b.slug === blogSlug);
        if (match) handleSelectBlog(match);
      } else {
        const res = await api(`/api/admin/blogs/${selectedBlog!.id}`, {
          method: "PUT",
          body: JSON.stringify(blogData),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to update blog post");
          return;
        }
        await fetchBlogs();
        queryClient.invalidateQueries({ queryKey: ['blogs'] });
        queryClient.invalidateQueries({ queryKey: ['blog', blogSlug] });
        // Update selected blog reference
        setSelectedBlog((prev) => (prev ? { ...prev, ...blogData } : null));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBlogSaving(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!selectedBlog || isNewBlog) return;
    if (
      !window.confirm(
        `Are you sure you want to delete the blog "${blogTitle}"?`,
      )
    )
      return;

    setBlogDeleting(true);
    try {
      const res = await api(`/api/admin/blogs/${selectedBlog.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedBlog(null);
        await fetchBlogs();
        queryClient.invalidateQueries({ queryKey: ['blogs'] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBlogDeleting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    setCommentDeletingId(commentId);
    try {
      const res = await api(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBlogComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentDeletingId(null);
    }
  };

  const handleBlogAiCompose = async (
    mode: "outline" | "polish" | "summary" | "write",
  ) => {
    if (mode !== "outline" && mode !== "write" && !blogContent) return;
    if (mode === "outline" && !blogTitle) {
      alert("Please specify a blog title first.");
      return;
    }

    setBlogAiLoading(true);
    try {
      let resultText = "";

      await loadPuter()
      if (aiProvider === "puter" && (window as any).puter?.ai) {
        let fullPrompt = "";
        if (mode === "outline") {
          fullPrompt = `You are a professional tech blogger. Generate a detailed, high-quality blog outline in Markdown for an article titled "${blogTitle}". Focus area/idea: ${blogAiPrompt || ""}. Focus on rendering clean headings, bullet points, and brief section ideas.`;
        } else if (mode === "polish") {
          fullPrompt = `You are a professional editor. Rewrite and polish the following draft in Markdown, improving clarity, grammar, flow, and vocabulary, while preserving the exact technical details and context:\n\n${blogContent}`;
        } else if (mode === "summary") {
          fullPrompt = `Summarize the following technical blog post in 1 or 2 sentences for an excerpt/summary field (max 150 characters):\n\n${blogContent}`;
        } else {
          fullPrompt = `Write or assist in writing a section for a tech blog post about: ${blogAiPrompt || ""}.\nContext/draft so far:\n${blogContent || ""}\n\nReturn output in clean Markdown format.`;
        }
        const response = await (window as any).puter.ai.chat(fullPrompt, {
          model: defaultAiModel,
        });
        resultText = typeof response === "string" ? response : String(response);
      } else {
        const res = await api("/api/admin/blogs/generate", {
          method: "POST",
          body: JSON.stringify({
            prompt:
              blogAiPrompt ||
              (mode === "write"
                ? "Write a section about full-stack architectures"
                : ""),
            content: blogContent,
            title: blogTitle,
            mode: mode,
          }),
        });
        if (!res.ok) throw new Error("AI generation failed");
        const data = await res.json();
        resultText = data.result;
      }

      if (mode === "summary") {
        setBlogSummary(resultText.trim());
      } else if (mode === "outline") {
        setBlogContent((prev) =>
          prev ? `${prev}\n\n${resultText.trim()}` : resultText.trim(),
        );
      } else if (mode === "polish") {
        setBlogContent(resultText.trim());
      } else {
        setBlogContent((prev) =>
          prev ? `${prev}\n\n${resultText.trim()}` : resultText.trim(),
        );
      }
      setBlogAiPrompt("");
    } catch (err) {
      console.error(err);
    } finally {
      setBlogAiLoading(false);
    }
  };

  // Filter messages dynamically based on tab and search query
  const filteredMessages = useMemo(
    () =>
      messages.filter((msg) => {
        const matchesSearch =
          msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (msg.subject &&
            msg.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
          msg.message.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterTab === "unreplied")
          return matchesSearch && msg.replied === 0;
        if (filterTab === "replied") return matchesSearch && msg.replied === 1;
        return matchesSearch;
      }),
    [messages, searchQuery, filterTab],
  );

  // Filter blogs dynamically
  const filteredBlogs = useMemo(
    () =>
      blogs.filter((blog) => {
        const matchesSearch =
          blog.title.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
          (blog.summary &&
            blog.summary
              .toLowerCase()
              .includes(blogSearchQuery.toLowerCase())) ||
          (blog.tags &&
            blog.tags.toLowerCase().includes(blogSearchQuery.toLowerCase()));

        if (blogFilterTab === "drafts")
          return matchesSearch && blog.published === 0;
        if (blogFilterTab === "published")
          return matchesSearch && blog.published === 1;
        return matchesSearch;
      }),
    [blogs, blogSearchQuery, blogFilterTab],
  );

  // Count summaries (single pass)
  const { inboxCount, repliedCount, draftCount, publishedCount } =
    useMemo(() => {
      let inbox = 0,
        replied = 0,
        drafts = 0,
        published = 0;
      for (const m of messages) {
        if (m.replied === 0) inbox++;
        else replied++;
      }
      for (const b of blogs) {
        if (b.published === 0) drafts++;
        else published++;
      }
      return {
        inboxCount: inbox,
        repliedCount: replied,
        draftCount: drafts,
        publishedCount: published,
      };
    }, [messages, blogs]);

  // Login view
  if (!token) {
    return (
      <LoginView
        password={password}
        setPassword={setPassword}
        handleLogin={handleLogin}
        loginError={loginError}
      />
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden transition-all duration-300"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <DashboardHeader
        refreshing={refreshing}
        refreshData={refreshData}
        handleLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSelected={setSelected}
        setSelectedBlog={setSelectedBlog}
        inboxCount={inboxCount}
      />

      {/* Main Content Area */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 h-[calc(100vh-var(--header-h,80px))] overflow-hidden"
        style={
          {
            "--header-h":
              activeTab === "analytics" || activeTab === "settings"
                ? "140px"
                : "80px",
          } as any
        }
      >
        <div className="grid grid-cols-1 gap-3 md:gap-6 h-full items-stretch md:grid-cols-12">
          {/* TAB 1: MESSAGES DASHBOARD */}
          {activeTab === "messages" && (
            <MessagesTab
              refreshing={refreshing}
              selected={selected}
              setSelected={setSelected}
              messages={messages}
              setMessages={setMessages}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterTab={filterTab}
              setFilterTab={setFilterTab}
              copiedEmail={copiedEmail}
              setCopiedEmail={setCopiedEmail}
              replySubject={replySubject}
              setReplySubject={setReplySubject}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
              sending={sending}
              setSending={setSending}
              aiLoading={aiLoading}
              setAiLoading={setAiLoading}
              aiPrompt={aiPrompt}
              setAiPrompt={setAiPrompt}
              defaultAiModel={defaultAiModel}
              filteredMessages={filteredMessages}
              inboxCount={inboxCount}
              repliedCount={repliedCount}
              handleSendReply={handleSendReply}
              handleAiCompose={handleAiCompose}
              handleCopyEmail={handleCopyEmail}
              handleDeleteMessage={handleDeleteMessage}
            />
          )}

          {/* TAB 2: BLOGS DASHBOARD */}
          {activeTab === "blogs" && (
            <BlogsTab
              blogs={blogs}
              selectedBlog={selectedBlog}
              setSelectedBlog={setSelectedBlog}
              blogSearchQuery={blogSearchQuery}
              setBlogSearchQuery={setBlogSearchQuery}
              blogFilterTab={blogFilterTab}
              setBlogFilterTab={setBlogFilterTab}
              blogWords={blogWords}
              blogTitle={blogTitle}
              blogSlug={blogSlug}
              setBlogSlug={setBlogSlug}
              blogContent={blogContent}
              setBlogContent={setBlogContent}
              blogSummary={blogSummary}
              setBlogSummary={setBlogSummary}
              blogTags={blogTags}
              setBlogTags={setBlogTags}
              blogCategory={blogCategory}
              setBlogCategory={setBlogCategory}
              blogPublished={blogPublished}
              setBlogPublished={setBlogPublished}
              blogReadTime={blogReadTime}
              setBlogReadTime={setBlogReadTime}
              blogCoverImage={blogCoverImage}
              setBlogCoverImage={setBlogCoverImage}
              uploadingImage={uploadingImage}
              handleUploadImage={handleUploadImage}
              blogDevtoSummary={blogDevtoSummary}
              setBlogDevtoSummary={setBlogDevtoSummary}
              blogSocialSummary={blogSocialSummary}
              setBlogSocialSummary={setBlogSocialSummary}
              blogSummaryLoading={blogSummaryLoading}
              setBlogSummaryLoading={setBlogSummaryLoading}
              blogSocialLoading={blogSocialLoading}
              setBlogSocialLoading={setBlogSocialLoading}
              blogSummaryCached={blogSummaryCached}
              setBlogSummaryCached={setBlogSummaryCached}
              blogSocialCached={blogSocialCached}
              setBlogSocialCached={setBlogSocialCached}
              summarizerProvider={summarizerProvider}
              setSummarizerProvider={setSummarizerProvider}
              summarizerModel={summarizerModel}
              setSummarizerModel={setSummarizerModel}
              blogComments={blogComments}
              isMetadataExpanded={isMetadataExpanded}
              setIsMetadataExpanded={setIsMetadataExpanded}
              isAiCopilotExpanded={isAiCopilotExpanded}
              setIsAiCopilotExpanded={setIsAiCopilotExpanded}
              isCommentsExpanded={isCommentsExpanded}
              setIsCommentsExpanded={setIsCommentsExpanded}
              blogEditorTab={blogEditorTab}
              setBlogEditorTab={setBlogEditorTab}
              isNewBlog={isNewBlog}
              blogAiPrompt={blogAiPrompt}
              setBlogAiPrompt={setBlogAiPrompt}
              blogAiLoading={blogAiLoading}
              blogSaving={blogSaving}
              blogDeleting={blogDeleting}
              commentDeletingId={commentDeletingId}
              setFocusContentMode={setFocusContentMode}
              setMonacoEditor={setMonacoEditor}
              parsedBlogContent={parsedBlogContent}
              setZoomedBlock={setZoomedBlock}
              previewSubTab={previewSubTab}
              setPreviewSubTab={setPreviewSubTab}
              previewLogs={previewLogs}
              setPreviewLogs={setPreviewLogs}
              handleAskAiFix={handleAskAiFix}
              fixingErrorId={fixingErrorId}
              aiSuggestions={aiSuggestions}
              refreshing={refreshing}
              filteredBlogs={filteredBlogs}
              draftCount={draftCount}
              publishedCount={publishedCount}
              handleNewBlog={handleNewBlog}
              handleSelectBlog={handleSelectBlog}
              handleSaveBlog={handleSaveBlog}
              handleDeleteBlog={handleDeleteBlog}
              handleDeleteComment={handleDeleteComment}
              handleBlogTitleChange={handleBlogTitleChange}
              handleBlogAiCompose={handleBlogAiCompose}
              renderInlinePreview={renderInlinePreview}
              api={api}
            />
          )}

           {/* TAB 6: PROJECTS */}
           {activeTab === "projects" && <ProjectsTab />}

           {/* TAB 7: SKILLS */}
           {activeTab === "skills" && <SkillsTab />}

           {/* TAB 8: ABOUT */}
           {activeTab === "about" && <AboutTab />}

           {/* TAB 9: EXPERIENCE */}
           {activeTab === "experience" && <ExperienceTab />}

           {/* TAB 10: AWARDS */}
           {activeTab === "awards" && <AwardsTab />}

           {/* TAB 8: AUDIT LOGS */}
           {activeTab === "audit" && (
            <AuditLogsTab />
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <SettingsTab
              blogs={blogs}
              defaultTheme={defaultTheme}
              defaultAccent={defaultAccent}
              rotationThemeEnabled={rotationThemeEnabled}
              rotationAccentEnabled={rotationAccentEnabled}
              rotationIntervalHours={rotationIntervalHours}
              cursorEnabled={cursorEnabled}
              paypalDonateUrl={paypalDonateUrl}
              setPaypalDonateUrl={setPaypalDonateUrl}
              paypalSaved={paypalSaved}
              defaultAiModel={defaultAiModel}
              setDefaultAiModel={setDefaultAiModel}
              defaultAiModelSaved={defaultAiModelSaved}
              aiProvider={aiProvider}
              setAiProvider={setAiProvider}
              aiProviderSaved={aiProviderSaved}
              aiProvidersConfig={aiProvidersConfig}
              aiModels={aiModels}
              featuredSlug={featuredSlug}
              setFeaturedSlugLocal={setFeaturedSlugLocal}
              featuredSaved={featuredSaved}
              n8nPortfolioKey={n8nPortfolioKey}
              setN8nPortfolioKey={setN8nPortfolioKey}
              n8nDevtoKey={n8nDevtoKey}
              setN8nDevtoKey={setN8nDevtoKey}
              n8nWebhookUrl={n8nWebhookUrl}
              setN8nWebhookUrl={setN8nWebhookUrl}
              n8nSaved={n8nSaved}
              devtoApiKey={devtoApiKey}
              setDevtoApiKey={setDevtoApiKey}
              devtoUsername={devtoUsername}
              setDevtoUsername={setDevtoUsername}
              devtoSaved={devtoSaved}
              devtoStatus={devtoStatus}
              devtoStatusLoading={devtoStatusLoading}
              profilePicUrl={profilePicUrl}
              profilePicUploading={profilePicUploading}
              profilePicResetting={profilePicResetting}
              profilePicMsg={profilePicMsg}
              profilePicFileRef={profilePicFileRef}
              generatingToken={generatingToken}
              downloading={downloading}
              tokenExists={tokenExists}
              handleDefaultThemeChange={handleDefaultThemeChange}
              handleDefaultAccentChange={handleDefaultAccentChange}
              toggleRotationTheme={toggleRotationTheme}
              toggleRotationAccent={toggleRotationAccent}
              handleIntervalChange={handleIntervalChange}
              toggleCursor={toggleCursor}
              handleProfilePicUpload={handleProfilePicUpload}
              handleProfilePicReset={handleProfilePicReset}
              handleFeaturedSave={handleFeaturedSave}
              handlePaypalSave={handlePaypalSave}
              handleProviderSave={handleProviderSave}
              handleDevtoModelSave={handleDevtoModelSave}
              handleDevtoSettingsSave={handleDevtoSettingsSave}
              handleGenerateToken={handleGenerateToken}
              handleRevokeToken={handleRevokeToken}
              handleDownloadWorkflow={handleDownloadWorkflow}
              handleN8nSave={handleN8nSave}
              loadDevtoStatus={loadDevtoStatus}
              getRequiredFieldsFilled={getRequiredFieldsFilled}
            />
          )}


           {/* TAB 4: ANALYTICS */}
           {activeTab === "analytics" && (
             <AnalyticsTab
               visitors={visitors}
               dailyVisits={dailyVisits}
               hourlyVisits={hourlyVisits}
               visitorLoading={visitorLoading}
               visitorRefreshing={visitorRefreshing}
               unfilteredTotal={unfilteredTotal}
              unfilteredVisits={unfilteredVisits}
              setGridPage={setGridPage}
               gridLimit={gridLimit}
               setGridLimit={setGridLimit}
               gridSort={gridSort}
               setGridSort={setGridSort}
               gridOrder={gridOrder}
               setGridOrder={setGridOrder}
               gridSearch={gridSearch}
               setGridSearch={setGridSearch}
               gridCountry={gridCountry}
               setGridCountry={setGridCountry}
               gridShowHumansOnly={gridShowHumansOnly}
               setGridShowHumansOnly={setGridShowHumansOnly}
               gridGroupByCountry={gridGroupByCountry}
               setGridGroupByCountry={setGridGroupByCountry}
               expandedCountries={expandedCountries}
               gridPagination={gridPagination}
               gridCountries={gridCountries}
              countryStats={countryStats}
              deviceTotal={deviceTotal}
               browserTotal={browserTotal}
               todayCount={todayCount}
               yesterdayCount={yesterdayCount}
               dailyChartData={dailyChartData}
               hourlyChartData={hourlyChartData}
               sortedDevices={sortedDevices}
               sortedBrowsers={sortedBrowsers}
               maxCountryCount={maxCountryCount}
               paginationPages={paginationPages}
               groupedVisitors={groupedVisitors}
               cleanupOpen={cleanupOpen}
               setCleanupOpen={setCleanupOpen}
               cleanupFrom={cleanupFrom}
               setCleanupFrom={setCleanupFrom}
               cleanupTo={cleanupTo}
               setCleanupTo={setCleanupTo}
               cleanupTables={cleanupTables}
               setCleanupTables={setCleanupTables}
               cleanupPreview={cleanupPreview}
               setCleanupPreview={setCleanupPreview}
               cleanupLoading={cleanupLoading}
               cleanupResult={cleanupResult}
               setCleanupResult={setCleanupResult}
               cleanupConfirm={cleanupConfirm}
               setCleanupConfirm={setCleanupConfirm}
               toggleCountry={toggleCountry}
               fetchVisitors={fetchVisitors}
               exportCSV={exportCSV}
               previewCleanup={previewCleanup}
               executeCleanup={executeCleanup}
               gridStartDate={gridStartDate}
               setGridStartDate={setGridStartDate}
               gridEndDate={gridEndDate}
               setGridEndDate={setGridEndDate}
               topPages={topPages}
               topPagesLoading={topPagesLoading}
             />
           )}

              <FocusModeOverlay
            focusContentMode={focusContentMode}
            setFocusContentMode={setFocusContentMode}
            blogTitle={blogTitle}
            blogContent={blogContent}
            setBlogContent={setBlogContent}
            blogWords={blogWords}
            setMonacoEditor={setMonacoEditor}
            renderInlinePreview={renderInlinePreview}
            zoomedBlock={zoomedBlock}
            setZoomedBlock={setZoomedBlock}
            zoomedCode={zoomedCode}
            setZoomedCode={setZoomedCode}
            debouncedZoomedCode={debouncedZoomedCode}
            applyZoomedChanges={applyZoomedChanges}
          />
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;

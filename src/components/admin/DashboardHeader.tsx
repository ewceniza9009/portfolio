import React from 'react';
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  RefreshCw,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Moon,
  Sun,
  ShieldAlert,
  Briefcase,
  Code,
  User,
  Award
} from "lucide-react";
import Logo from "../Logo";
import { AccentDropdown } from "../Navbar";
import type { AccentKey } from "../../data/accents";

interface DashboardHeaderProps {
  theme: "dark" | "light";
  toggleTheme: () => void;
  accent: AccentKey;
  setAccent: (val: AccentKey) => void;
  refreshing: boolean;
  refreshData: () => void;
  handleLogout: () => void;
  activeTab: "messages" | "blogs" | "analytics" | "audit" | "settings" | "projects" | "skills" | "about" | "experience" | "awards";
  setActiveTab: (tab: "messages" | "blogs" | "analytics" | "audit" | "settings" | "projects" | "skills" | "about" | "experience" | "awards") => void;
  setSelected: (val: null) => void;
  setSelectedBlog: (val: null) => void;
  inboxCount: number;
}

function DashboardHeader({
  theme,
  toggleTheme,
  accent,
  setAccent,
  refreshing,
  refreshData,
  handleLogout,
  activeTab,
  setActiveTab,
  setSelected,
  setSelectedBlog,
  inboxCount,
}: DashboardHeaderProps) {
  return (
    <header
      className="border-b px-3 md:px-6 py-3 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-30 glass shadow-sm gap-3"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3 w-full md:w-auto">
        <a
          href="/"
          className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border transition-all hover:scale-105 shrink-0"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <ArrowLeft size={14} />
        </a>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center hover:opacity-85 transition-opacity duration-200"
          >
            <Logo size={24} className="flex-shrink-0" />
          </Link>
          <span
            className="text-[10px] md:text-xs uppercase tracking-widest opacity-60 border-l pl-2 ml-1"
            style={{ borderColor: "var(--border)" }}
          >
            Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto md:hidden">
          <AccentDropdown accent={accent} onChangeAccent={setAccent} theme={theme} />
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center border transition-all"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-secondary)",
              color: "var(--text-secondary)",
            }}
          >
            {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="w-8 h-8 rounded-full flex items-center justify-center border"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-secondary)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw
              size={12}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <LogOut size={11} />
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div
        className="flex p-1 rounded-xl border overflow-x-auto w-full md:w-auto flex-nowrap"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <button
          onClick={() => {
            setActiveTab("messages");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background:
              activeTab === "messages" ? "var(--accent)" : "transparent",
            color:
              activeTab === "messages"
                ? "var(--bg-primary)"
                : "var(--text-secondary)",
          }}
        >
          <MessageSquare size={11} />
          <span className="hidden sm:inline">Inquiries</span>
          {inboxCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("blogs");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background:
              activeTab === "blogs" ? "var(--accent)" : "transparent",
            color:
              activeTab === "blogs"
                ? "var(--bg-primary)"
                : "var(--text-secondary)",
          }}
        >
          <FileText size={11} />
          <span className="hidden sm:inline">Blogs</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("analytics");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background:
              activeTab === "analytics" ? "var(--accent)" : "transparent",
            color:
              activeTab === "analytics"
                ? "var(--bg-primary)"
                : "var(--text-secondary)",
          }}
        >
          <BarChart3 size={11} />
          <span className="hidden sm:inline">Analytics</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("projects");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background: activeTab === "projects" ? "var(--accent)" : "transparent",
            color: activeTab === "projects" ? "var(--bg-primary)" : "var(--text-secondary)",
          }}
        >
          <Briefcase size={11} />
          <span className="hidden sm:inline">Projects</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("skills");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background: activeTab === "skills" ? "var(--accent)" : "transparent",
            color: activeTab === "skills" ? "var(--bg-primary)" : "var(--text-secondary)",
          }}
        >
          <Code size={11} />
          <span className="hidden sm:inline">Skills</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("about");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background: activeTab === "about" ? "var(--accent)" : "transparent",
            color: activeTab === "about" ? "var(--bg-primary)" : "var(--text-secondary)",
          }}
        >
          <User size={11} />
          <span className="hidden sm:inline">About</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("experience");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background: activeTab === "experience" ? "var(--accent)" : "transparent",
            color: activeTab === "experience" ? "var(--bg-primary)" : "var(--text-secondary)",
          }}
        >
          <Briefcase size={11} />
          <span className="hidden sm:inline">Experience</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("awards");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background: activeTab === "awards" ? "var(--accent)" : "transparent",
            color: activeTab === "awards" ? "var(--bg-primary)" : "var(--text-secondary)",
          }}
        >
          <Award size={11} />
          <span className="hidden sm:inline">Awards</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("settings");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background:
              activeTab === "settings" ? "var(--accent)" : "transparent",
            color:
              activeTab === "settings"
                ? "var(--bg-primary)"
                : "var(--text-secondary)",
          }}
        >
          <Settings size={11} />
          <span className="hidden sm:inline">Settings</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("audit");
            setSelected(null);
            setSelectedBlog(null);
          }}
          className="px-2.5 md:px-4 py-1.5 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5"
          style={{
            background:
              activeTab === "audit" ? "var(--accent)" : "transparent",
            color:
              activeTab === "audit"
                ? "var(--bg-primary)"
                : "var(--text-secondary)",
          }}
        >
          <ShieldAlert size={11} />
          <span className="hidden sm:inline">Audit</span>
        </button>
      </div>

      {/* Header Right Actions (desktop) */}
      <div className="hidden md:flex items-center gap-3">
        <AccentDropdown accent={accent} onChangeAccent={setAccent} theme={theme} />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
          }}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-105 active:scale-95"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
          }}
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 hover:bg-[#ef4444]/10 hover:border-[#ef4444]/30"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </header>
  );
}

export default React.memo(DashboardHeader);

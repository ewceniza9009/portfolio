import React from 'react';
import { Fragment } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Trash2,
  Eye,
  BarChart3,
  Activity,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Loader,
} from "lucide-react";
import { VISITOR_TABLE_COLUMNS } from "./helpers";

const manilaDateStr = (d: Date) => {
  const ph = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return ph.toISOString().slice(0, 10);
};

export interface AnalyticsTabProps {
  visitors: any[];
  dailyVisits: any[];
  hourlyVisits: any[];
  visitorLoading: boolean;
  visitorRefreshing: boolean;
  unfilteredTotal: number;
  unfilteredVisits: number;
  setGridPage: (v: number | ((p: number) => number)) => void;
  gridLimit: number;
  setGridLimit: (v: number) => void;
  gridSort: string;
  setGridSort: (v: string) => void;
  gridOrder: "asc" | "desc";
  setGridOrder: (v: "asc" | "desc" | ((prev: "asc" | "desc") => "asc" | "desc")) => void;
  gridSearch: string;
  setGridSearch: (v: string) => void;
  gridCountry: string;
  setGridCountry: (v: string) => void;
  gridShowHumansOnly: boolean;
  setGridShowHumansOnly: (v: boolean | ((prev: boolean) => boolean)) => void;
  gridGroupByCountry: boolean;
  setGridGroupByCountry: (v: boolean | ((prev: boolean) => boolean)) => void;
  expandedCountries: Record<string, boolean>;
  gridPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  gridCountries: string[];
  countryStats: { name: string; count: number }[];
  deviceTotal: number;
  browserTotal: number;
  todayCount: number;
  yesterdayCount: number;
  dailyChartData: any[];
  hourlyChartData: any[];
  sortedDevices: [string, number][];
  sortedBrowsers: [string, number][];
  maxCountryCount: number;
  paginationPages: (number | "...")[];
  groupedVisitors: [string, any[]][] | null;
  cleanupOpen: boolean;
  setCleanupOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  cleanupFrom: string;
  setCleanupFrom: (v: string) => void;
  cleanupTo: string;
  setCleanupTo: (v: string) => void;
  cleanupTables: string[];
  setCleanupTables: (v: string[] | ((prev: string[]) => string[])) => void;
  cleanupPreview: { daily: number; hourly: number; visitors: number } | null;
  setCleanupPreview: (v: { daily: number; hourly: number; visitors: number } | null) => void;
  cleanupLoading: boolean;
  cleanupResult: string | null;
  setCleanupResult: (v: string | null) => void;
  cleanupConfirm: boolean;
  setCleanupConfirm: (v: boolean) => void;
  toggleCountry: (country: string) => void;
  fetchVisitors: () => void;
  exportCSV: () => void;
  previewCleanup: () => void;
  executeCleanup: () => void;
  gridStartDate: string;
  setGridStartDate: (v: string) => void;
  gridEndDate: string;
  setGridEndDate: (v: string) => void;
  topPages: { path: string; views: number; unique_visitors: number }[];
  topPagesLoading: boolean;
}

function AnalyticsTab({
  visitors,
  dailyVisits,
  hourlyVisits,
  visitorLoading,
  visitorRefreshing,
  unfilteredTotal,
  unfilteredVisits,
  setGridPage,
  gridLimit,
  setGridLimit,
  gridSort,
  setGridSort,
  gridOrder,
  setGridOrder,
  gridSearch,
  setGridSearch,
  gridCountry,
  setGridCountry,
  gridShowHumansOnly,
  setGridShowHumansOnly,
  gridGroupByCountry,
  setGridGroupByCountry,
  expandedCountries,
  gridPagination,
  gridCountries,
  countryStats,
  deviceTotal,
  browserTotal,
  todayCount,
  yesterdayCount,
  dailyChartData,
  hourlyChartData,
  sortedDevices,
  sortedBrowsers,
  maxCountryCount,
  paginationPages,
  groupedVisitors,
  cleanupOpen,
  setCleanupOpen,
  cleanupFrom,
  setCleanupFrom,
  cleanupTo,
  setCleanupTo,
  cleanupTables,
  setCleanupTables,
  cleanupPreview,
  setCleanupPreview,
  cleanupLoading,
  cleanupResult,
  setCleanupResult,
  cleanupConfirm,
  setCleanupConfirm,
  toggleCountry,
  fetchVisitors,
  exportCSV,
  previewCleanup,
  executeCleanup,
  gridStartDate,
  setGridStartDate,
  gridEndDate,
  setGridEndDate,
  topPages,
  topPagesLoading,
}: AnalyticsTabProps) {
  return (
    <div
      className="col-span-12 flex flex-col rounded-2xl border overflow-hidden max-h-full"
      style={{
        background: "var(--glass-bg)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="p-4 md:p-6 border-b shrink-0 flex flex-wrap items-center gap-2"
        style={{ borderColor: "var(--border)" }}
      >
        <BarChart3 size={16} style={{ color: "var(--accent)" }} />
        <div className="min-w-0">
          <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider truncate">
            Visitor Analytics
          </h3>
          <p
            className="text-[9px] md:text-[10px] truncate"
            style={{ color: "var(--text-muted)" }}
          >
            Track and analyze your portfolio visitors
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={fetchVisitors}
            className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
            disabled={visitorRefreshing}
          >
            <RefreshCw
              size={10}
              className={visitorRefreshing ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">
              {visitorRefreshing ? "Loading..." : "Refresh"}
            </span>
          </button>
          <button
            onClick={exportCSV}
            className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5"
            style={{
              borderColor: "var(--accent)",
              color: "var(--accent)",
            }}
          >
            CSV
          </button>
          <button
            onClick={() => setGridShowHumansOnly(!gridShowHumansOnly)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5 ${
              gridShowHumansOnly ? "border-[var(--accent)] text-[var(--accent)]" : ""
            }`}
            title="Filter to show only human visitors (excludes bots/crawlers)"
          >
            {gridShowHumansOnly ? (
              <>
                <CheckCircle2 size={10} />
                <span className="hidden sm:inline">Humans Only</span>
              </>
            ) : (
              <>
                <Eye size={10} />
                <span className="hidden sm:inline">All Visitors</span>
              </>
            )}
          </button>
          <button
            onClick={() => setGridGroupByCountry(!gridGroupByCountry)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5 ${
              gridGroupByCountry ? "border-[var(--accent)] text-[var(--accent)]" : ""
            }`}
            title="Group visitors by country"
          >
            {gridGroupByCountry ? (
              <>
                <ChevronDown size={10} />
                <span className="hidden sm:inline">Grouped</span>
              </>
            ) : (
              <>
                <ChevronRight size={10} />
                <span className="hidden sm:inline">Group</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-8 custom-scrollbar transition-opacity duration-200 ${visitorRefreshing ? "opacity-60 pointer-events-none" : "opacity-100"}`}
      >
        {visitorLoading && visitors.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border p-5 space-y-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ background: "var(--bg-secondary)" }}
                  />
                  <div
                    className="w-16 h-6 rounded"
                    style={{ background: "var(--bg-secondary)" }}
                  />
                  <div
                    className="w-12 h-3 rounded"
                    style={{ background: "var(--bg-secondary)" }}
                  />
                </div>
              ))}
            </div>
            <div
              className="rounded-2xl border p-6 space-y-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="w-24 h-3 rounded"
                style={{ background: "var(--bg-secondary)" }}
              />
              <div
                className="w-full h-40 rounded-xl"
                style={{ background: "var(--bg-secondary)" }}
              />
            </div>
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-16">
            <Activity
              size={48}
              className="mx-auto mb-4 opacity-30"
              style={{ color: "var(--accent)" }}
            />
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              No visitor data yet
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Visit your portfolio to start tracking analytics.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
              {[
                {
                  label: "Unique",
                  value: unfilteredTotal,
                  Icon: Activity,
                },
                {
                  label: "Visits",
                  value: unfilteredVisits,
                  Icon: BarChart3,
                },
                {
                  label: "Today (Manila)",
                  value: todayCount,
                  Icon: Calendar,
                },
                {
                  label: "Yesterday",
                  value: yesterdayCount,
                  Icon: Calendar,
                },
                {
                  label: gridShowHumansOnly ? "Humans Only" : "All",
                  value: gridPagination.total,
                  Icon: gridShowHumansOnly ? CheckCircle2 : Eye,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-xl md:rounded-2xl border p-3 md:p-4 bg-white/[0.01]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.Icon
                      size={16}
                      className="opacity-70"
                      style={{ color: "var(--accent)" }}
                    />
                    <div
                      className="text-lg md:text-2xl font-bold"
                      style={{ color: "var(--accent)" }}
                    >
                      {stat.value}
                    </div>
                  </div>
                  <div
                    className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Visits + Peak Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {dailyVisits.length > 0 && (
                <div
                  className="rounded-xl md:rounded-2xl border p-3 md:p-6 bg-white/[0.01]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h4
                    className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3 md:mb-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Daily Traffic
                  </h4>
                  <div className="w-full" style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyChartData}>
                        <XAxis
                          dataKey="date"
                          tick={{
                            fontSize: 9,
                            fill: "var(--text-secondary)",
                          }}
                          tickFormatter={(v: string) => v.slice(5)}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 9,
                            fill: "var(--text-secondary)",
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={20}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            fontSize: 11,
                          }}
                          labelFormatter={(v: any) => String(v)}
                        />
                        <Bar
                          dataKey="count"
                          radius={[4, 4, 0, 0]}
                          fill="var(--accent)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {hourlyVisits.length > 0 && (
                <div
                  className="rounded-xl md:rounded-2xl border p-3 md:p-6 bg-white/[0.01]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h4
                    className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3 md:mb-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Peak Hours
                  </h4>
                  <div className="w-full" style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyChartData}>
                        <XAxis
                          dataKey="hour"
                          tick={{
                            fontSize: 8,
                            fill: "var(--text-secondary)",
                          }}
                          tickFormatter={(v: string) => v.slice(11, 16)}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 9,
                            fill: "var(--text-secondary)",
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={20}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            fontSize: 11,
                          }}
                          labelFormatter={(v: any) => String(v)}
                        />
                        <Bar
                          dataKey="count"
                          radius={[4, 4, 0, 0]}
                          fill="var(--accent)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Country / Device / Browser */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="rounded-2xl border p-6 bg-white/[0.01]"
                style={{ borderColor: "var(--border)" }}
              >
                <h4
                  className="text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  By Country
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {countryStats.slice(0, 8).map((c: any) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="text-[10px] w-5 font-bold"
                        style={{ color: "var(--accent)" }}
                      >
                        {c.count}
                      </span>
                      <div
                        className="flex-1 h-4 rounded-md"
                        style={{
                          background: "var(--bg-secondary)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="h-full rounded-md transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.min(100, (c.count / maxCountryCount) * 100)}%`,
                            background: "var(--accent)",
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] w-24 text-right truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {c.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="rounded-2xl border p-6 bg-white/[0.01]"
                style={{ borderColor: "var(--border)" }}
              >
                <h4
                  className="text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  By Device
                </h4>
                <div className="space-y-2">
                  {sortedDevices.map(([name, count]: any) => {
                    const icons: Record<string, any> = {
                      Desktop: Monitor,
                      Mobile: Smartphone,
                      Tablet: Tablet,
                    };
                    const IconComponent = icons[name] || Monitor;
                    return (
                      <div
                        key={name}
                        className="flex items-center gap-3"
                      >
                        <IconComponent
                          size={14}
                          style={{ color: "var(--accent)" }}
                        />
                        <span
                          className="text-[10px] w-5 font-bold"
                          style={{ color: "var(--accent)" }}
                        >
                          {count}
                        </span>
                        <div
                          className="flex-1 h-4 rounded-md"
                          style={{
                            background: "var(--bg-secondary)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            className="h-full rounded-md transition-all duration-500 ease-out"
                            style={{
                              width: `${(count / deviceTotal) * 100}%`,
                              background: "var(--accent)",
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] w-12 text-right"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div
                className="rounded-2xl border p-6 bg-white/[0.01]"
                style={{ borderColor: "var(--border)" }}
              >
                <h4
                  className="text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  By Browser
                </h4>
                <div className="space-y-2">
                  {sortedBrowsers.map(([name, count]: any) => {
                    return (
                      <div
                        key={name}
                        className="flex items-center gap-3"
                      >
                        <span
                          className="text-[10px] w-5 font-bold"
                          style={{ color: "var(--accent)" }}
                        >
                          {count}
                        </span>
                        <div
                          className="flex-1 h-4 rounded-md"
                          style={{
                            background: "var(--bg-secondary)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            className="h-full rounded-md transition-all duration-500 ease-out"
                            style={{
                              width: `${(count / browserTotal) * 100}%`,
                              background: "var(--accent)",
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] w-16 text-right truncate"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Pages Table */}
            <div
              className="rounded-2xl border overflow-hidden bg-white/[0.01] mb-6"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="p-4 md:p-5 flex items-center justify-between border-b" style={{ borderColor: "var(--border)" }}>
                <h4
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Activity size={14} /> Top Pages
                </h4>
                {topPagesLoading && <Loader size={12} className="animate-spin text-gray-500" />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead
                    className="border-b"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <tr>
                      <th className="py-2.5 px-4 text-left font-semibold text-gray-400">Path</th>
                      <th className="py-2.5 px-4 text-left font-semibold text-gray-400">Total Views</th>
                      <th className="py-2.5 px-4 text-left font-semibold text-gray-400">Unique Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {topPages.map((page, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-4 font-mono truncate max-w-[200px]" style={{ color: "var(--accent)" }}>{page.path}</td>
                        <td className="py-2 px-4 text-gray-300">{page.views}</td>
                        <td className="py-2 px-4 text-gray-300">{page.unique_visitors}</td>
                      </tr>
                    ))}
                    {topPages.length === 0 && !topPagesLoading && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-gray-500">No page data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visitor Log Table */}
            <div
              className="rounded-2xl border overflow-hidden bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Toolbar */}
              <div className="p-4 md:p-5 pb-0 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Visitor Log
                  </h4>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {gridPagination.total.toLocaleString()} total
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[180px]">
                    <Search
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      type="text"
                      placeholder="Search IP, country, city, referrer..."
                      value={gridSearch}
                      onChange={(e) => setGridSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-[11px] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    />
                    {gridSearch && (
                      <button
                        onClick={() => setGridSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          x
                        </span>
                      </button>
                    )}
                  </div>
                  {/* Country filter */}
                  <select
                    value={gridCountry}
                    onChange={(e) => setGridCountry(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border text-[11px] outline-none cursor-pointer"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <option value="">All Countries</option>
                    {gridCountries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {/* Date Range filter */}
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={gridStartDate}
                      onChange={(e) => setGridStartDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border text-[11px] outline-none cursor-pointer"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    />
                    <span className="text-[11px] text-[var(--text-muted)]">-</span>
                    <input
                      type="date"
                      value={gridEndDate}
                      onChange={(e) => setGridEndDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border text-[11px] outline-none cursor-pointer"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    />
                    {(gridStartDate || gridEndDate) && (
                      <button
                        onClick={() => { setGridStartDate(""); setGridEndDate(""); }}
                        className="p-1 hover:text-[var(--accent)] text-[var(--text-muted)] transition-colors"
                        title="Clear Dates"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  {/* Page size */}
                  <select
                    value={gridLimit}
                    onChange={(e) =>
                      setGridLimit(Number(e.target.value))
                    }
                    className="px-2.5 py-1.5 rounded-lg border text-[11px] outline-none cursor-pointer"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto p-4 md:p-5 pt-3">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {VISITOR_TABLE_COLUMNS.map((col) => (
                        <th
                          key={col.label}
                          className={`p-3 font-semibold cursor-pointer select-none transition-colors hover:opacity-70 ${col.align === "right" ? "text-right" : "text-left"}`}
                          style={{ color: "var(--text-muted)" }}
                          onClick={() => {
                            if (!col.key) return;
                            if (gridSort === col.key) {
                              setGridOrder((prev) =>
                                prev === "asc" ? "desc" : "asc",
                              );
                            } else {
                              setGridSort(col.key);
                              setGridOrder("desc");
                            }
                          }}
                        >
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            {col.key && gridSort === col.key && (
                              <span style={{ color: "var(--accent)" }}>
                                {gridOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-[11px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {gridSearch || gridCountry
                            ? "No visitors match your filters"
                            : "No visitors yet"}
                        </td>
                      </tr>
                    ) : groupedVisitors ? (
                      groupedVisitors.map(([country, rows]: [string, any[]]) => (
                        <Fragment key={country}>
                          <tr
                            onClick={() => toggleCountry(country)}
                            className="cursor-pointer transition-colors hover:bg-white/[0.04]"
                            style={{ borderBottom: "1px solid var(--border)" }}
                          >
                            <td colSpan={7} className="p-3">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-xs" style={{ color: "var(--accent)" }}>
                                {expandedCountries[country] !== false ? (
                                  <ChevronDown size={12} />
                                ) : (
                                  <ChevronRight size={12} />
                                )}
                                {country}
                                <span className="opacity-50 font-normal" style={{ color: "var(--text-muted)" }}>
                                  ({rows.length})
                                </span>
                              </span>
                            </td>
                          </tr>
                          {expandedCountries[country] !== false && rows.map((v: any, i: number) => {
                            const loc = [v.city, v.region].filter(Boolean).join(", ") || v.country || "—";
                            let refDisplay = v.referrer || "";
                            try { refDisplay = refDisplay ? new URL(refDisplay).hostname : ""; } catch {}
                            return (
                              <tr key={v.ip} className="transition-colors duration-150 hover:bg-white/[0.04]"
                                style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}
                              >
                                <td className="p-3 pl-8"><span className="font-semibold">{loc}</span>{v.country && <span className="ml-1.5 opacity-60">{v.country}</span>}</td>
                                <td className="p-3 font-mono opacity-70">{v.ip}</td>
                                <td className="p-3 text-right font-bold" style={{ color: "var(--accent)" }}>{v.visit_count}</td>
                                <td className="p-3 max-w-[80px] truncate" style={{ color: "var(--text-secondary)" }} title={v.referrer || ""}>{refDisplay || "—"}</td>
                                <td className="p-3">{v.ref ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{v.ref}</span> : "—"}</td>
                                <td className="p-3" style={{ color: "var(--text-secondary)" }}>{v.first_visit?.replace("T", " ")?.slice(0, 16)}</td>
                                <td className="p-3" style={{ color: "var(--text-secondary)" }}>{v.last_visit?.replace("T", " ")?.slice(0, 16)}</td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      ))
                    ) : (
                      visitors.map((v: any, i: number) => {
                        const loc = [v.city, v.region].filter(Boolean).join(", ") || v.country || "—";
                        let refDisplay = v.referrer || "";
                        try { refDisplay = refDisplay ? new URL(refDisplay).hostname : ""; } catch {}
                        return (
                          <tr key={v.ip} className="transition-colors duration-150 hover:bg-white/[0.04]"
                            style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}
                          >
                            <td className="p-3"><span className="font-semibold">{loc}</span>{v.country && <span className="ml-1.5 opacity-60">{v.country}</span>}</td>
                            <td className="p-3 font-mono opacity-70">{v.ip}</td>
                            <td className="p-3 text-right font-bold" style={{ color: "var(--accent)" }}>{v.visit_count}</td>
                            <td className="p-3 max-w-[80px] truncate" style={{ color: "var(--text-secondary)" }} title={v.referrer || ""}>{refDisplay || "—"}</td>
                            <td className="p-3">{v.ref ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{v.ref}</span> : "—"}</td>
                            <td className="p-3" style={{ color: "var(--text-secondary)" }}>{v.first_visit?.replace("T", " ")?.slice(0, 16)}</td>
                            <td className="p-3" style={{ color: "var(--text-secondary)" }}>{v.last_visit?.replace("T", " ")?.slice(0, 16)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {gridPagination.totalPages > 1 && (
                <div className="px-4 md:px-5 pb-4 md:pb-5 flex items-center justify-between gap-3">
                  <div
                    className="text-[10px] font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Page {gridPagination.page} of{" "}
                    {gridPagination.totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setGridPage(1)}
                      disabled={gridPagination.page <= 1}
                      className="px-2 py-1 rounded border text-[10px] font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      &laquo;
                    </button>
                    <button
                      onClick={() =>
                        setGridPage((p) => Math.max(1, p - 1))
                      }
                      disabled={gridPagination.page <= 1}
                      className="px-2 py-1 rounded border text-[10px] font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      &lsaquo;
                    </button>
                    {paginationPages.map((p, idx) =>
                      p === "..." ? (
                        <span
                          key={`e${idx}`}
                          className="px-1 text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setGridPage(p as number)}
                          className="w-7 h-7 rounded border text-[10px] font-bold transition-all active:scale-95"
                          style={{
                            borderColor:
                              gridPagination.page === p
                                ? "var(--accent)"
                                : "var(--border)",
                            background:
                              gridPagination.page === p
                                ? "var(--accent)"
                                : "transparent",
                            color:
                              gridPagination.page === p
                                ? "var(--bg)"
                                : "var(--text-secondary)",
                          }}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() =>
                        setGridPage((p) =>
                          Math.min(gridPagination.totalPages, p + 1),
                        )
                      }
                      disabled={
                        gridPagination.page >= gridPagination.totalPages
                      }
                      className="px-2 py-1 rounded border text-[10px] font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      &rsaquo;
                    </button>
                    <button
                      onClick={() =>
                        setGridPage(gridPagination.totalPages)
                      }
                      disabled={
                        gridPagination.page >= gridPagination.totalPages
                      }
                      className="px-2 py-1 rounded border text-[10px] font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      &raquo;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Data Cleanup Panel */}
            <div
              className="rounded-2xl border overflow-hidden bg-white/[0.01]"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                onClick={() => setCleanupOpen(!cleanupOpen)}
                className="w-full p-4 md:p-5 flex items-center gap-3 text-left transition-colors hover:bg-white/[0.02]"
              >
                <Trash2 size={14} style={{ color: "var(--accent)" }} />
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-[10px] md:text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Data Cleanup
                  </h4>
                  <p
                    className="text-[9px] md:text-[10px] mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Remove analytics data by date range
                  </p>
                </div>
                <ChevronDown
                  size={12}
                  style={{
                    color: "var(--text-muted)",
                    transition: "transform 0.2s",
                    transform: cleanupOpen
                      ? "rotate(180deg)"
                      : "rotate(0)",
                  }}
                />
              </button>

              {cleanupOpen && (
                <div
                  className="px-4 md:px-5 pb-4 md:pb-5 space-y-4 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* Date Range */}
                  <div className="flex flex-wrap items-end gap-3 pt-4">
                    <div className="flex flex-col gap-1">
                      <label
                        className="text-[9px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        From
                      </label>
                      <input
                        type="date"
                        value={cleanupFrom}
                        onChange={(e) => {
                          setCleanupFrom(e.target.value);
                          setCleanupPreview(null);
                          setCleanupResult(null);
                          setCleanupConfirm(false);
                        }}
                        className="px-3 py-1.5 rounded-lg border text-[11px] outline-none focus:ring-1"
                        style={{
                          background: "var(--bg-secondary)",
                          borderColor: "var(--border)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        className="text-[9px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        To
                      </label>
                      <input
                        type="date"
                        value={cleanupTo}
                        onChange={(e) => {
                          setCleanupTo(e.target.value);
                          setCleanupPreview(null);
                          setCleanupResult(null);
                          setCleanupConfirm(false);
                        }}
                        className="px-3 py-1.5 rounded-lg border text-[11px] outline-none focus:ring-1"
                        style={{
                          background: "var(--bg-secondary)",
                          borderColor: "var(--border)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        {
                          label: "7d",
                          from: () => {
                            const d = new Date();
                            d.setDate(d.getDate() - 7);
                            return manilaDateStr(d);
                          },
                        },
                        {
                          label: "30d",
                          from: () => {
                            const d = new Date();
                            d.setDate(d.getDate() - 30);
                            return manilaDateStr(d);
                          },
                        },
                        {
                          label: "90d",
                          from: () => {
                            const d = new Date();
                            d.setDate(d.getDate() - 90);
                            return manilaDateStr(d);
                          },
                        },
                        { label: "All", from: () => "2020-01-01" },
                      ].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => {
                            setCleanupFrom(p.from());
                            setCleanupTo(
                              manilaDateStr(new Date()),
                            );
                            setCleanupPreview(null);
                            setCleanupResult(null);
                            setCleanupConfirm(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all hover:opacity-80 active:scale-95"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table Checkboxes */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: "daily", label: "Daily Visits" },
                      { key: "hourly", label: "Hourly Visits" },
                      { key: "visitors", label: "Visitor Records" },
                    ].map((t) => (
                      <label
                        key={t.key}
                        className="flex items-center gap-1.5 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={cleanupTables.includes(t.key)}
                          onChange={(e) => {
                            setCleanupTables((prev) =>
                              e.target.checked
                                ? [...prev, t.key]
                                : prev.filter((x) => x !== t.key),
                            );
                            setCleanupPreview(null);
                            setCleanupResult(null);
                            setCleanupConfirm(false);
                          }}
                          className="rounded accent-[var(--accent)]"
                        />
                        <span
                          className="text-[10px] font-semibold group-hover:opacity-80 transition-opacity"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {t.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Preview Button */}
                  {cleanupFrom &&
                    cleanupTo &&
                    cleanupTables.length > 0 &&
                    !cleanupPreview && (
                      <button
                        onClick={previewCleanup}
                        disabled={cleanupLoading}
                        className="px-4 py-2 rounded-xl border text-[10px] md:text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                        style={{
                          borderColor: "var(--accent)",
                          color: "var(--accent)",
                        }}
                      >
                        {cleanupLoading ? (
                          <Loader size={10} className="animate-spin" />
                        ) : (
                          <Eye size={10} />
                        )}
                        Preview Impact
                      </button>
                    )}

                  {/* Preview Results */}
                  {cleanupPreview && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            key: "daily",
                            label: "Daily Rows",
                            color: "#f59e0b",
                          },
                          {
                            key: "hourly",
                            label: "Hourly Rows",
                            color: "#3b82f6",
                          },
                          {
                            key: "visitors",
                            label: "Visitors",
                            color: "#ef4444",
                          },
                        ]
                          .filter((item) =>
                            cleanupTables.includes(item.key),
                          )
                          .map((item) => (
                            <div
                              key={item.key}
                              className="rounded-xl border p-3 text-center"
                              style={{ borderColor: "var(--border)" }}
                            >
                              <div
                                className="text-lg font-bold"
                                style={{ color: item.color }}
                              >
                                {cleanupPreview[
                                  item.key as keyof typeof cleanupPreview
                                ] || 0}
                              </div>
                              <div
                                className="text-[9px] font-semibold uppercase tracking-wider"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {item.label}
                              </div>
                            </div>
                          ))}
                      </div>

                      {!cleanupConfirm ? (
                        <button
                          onClick={() => setCleanupConfirm(true)}
                          className="px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                          style={{
                            background: "var(--accent)",
                            color: "var(--bg)",
                          }}
                        >
                          <Trash2 size={10} />
                          Confirm Delete
                        </button>
                      ) : (
                        <div
                          className="flex items-center gap-2 p-3 rounded-xl border"
                          style={{
                            borderColor: "#ef4444",
                            background: "rgba(239,68,68,0.05)",
                          }}
                        >
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color: "#ef4444" }}
                          >
                            This cannot be undone. Delete now?
                          </span>
                          <button
                            onClick={executeCleanup}
                            disabled={cleanupLoading}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1"
                            style={{
                              background: "#ef4444",
                              color: "#fff",
                            }}
                          >
                            {cleanupLoading ? (
                              <Loader
                                size={10}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={10} />
                            )}
                            Delete
                          </button>
                          <button
                            onClick={() => setCleanupConfirm(false)}
                            className="px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95"
                            style={{
                              borderColor: "var(--border)",
                              color: "var(--text-muted)",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Result Message */}
                  {cleanupResult && (
                    <div
                      className="flex items-center gap-2 p-3 rounded-xl border"
                      style={{
                        borderColor: "var(--accent)",
                        background: "rgba(var(--accent-rgb), 0.05)",
                      }}
                    >
                      <CheckCircle2
                        size={12}
                        style={{ color: "var(--accent)" }}
                      />
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: "var(--accent)" }}
                      >
                        {cleanupResult}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default React.memo(AnalyticsTab);

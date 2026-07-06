import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Loader,
  ArrowLeft,
  Search,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit,
  Plus,
  FileText,
  Eye,
  Heart,
  Maximize2,
  Monitor,
  Upload,
} from "lucide-react";
import { formatDate, slugify } from "../../utils/format";
import type { Blog, Comment } from "../../types/blog";
import MarkdownEditor from "../MarkdownEditor";
import { loadPuter } from "../../utils/loadPuter";

interface BlogsTabProps {
  blogs: Blog[];
  selectedBlog: Blog | null;
  setSelectedBlog: (blog: Blog | null) => void;
  blogSearchQuery: string;
  setBlogSearchQuery: (val: string) => void;
  blogFilterTab: "all" | "drafts" | "published";
  setBlogFilterTab: (val: "all" | "drafts" | "published") => void;
  blogWords: string[];
  blogTitle: string;
  blogSlug: string;
  setBlogSlug: (val: string) => void;
  blogContent: string;
  setBlogContent: (val: string) => void;
  blogSummary: string;
  setBlogSummary: (val: string) => void;
  blogTags: string;
  setBlogTags: (val: string) => void;
  blogCategory: string;
  setBlogCategory: (val: string) => void;
  blogPublished: boolean;
  setBlogPublished: (val: boolean) => void;
  blogReadTime: string;
  setBlogReadTime: (val: string) => void;
  blogCoverImage: string;
  setBlogCoverImage: (val: string) => void;
  blogDevtoSummary: string;
  setBlogDevtoSummary: (val: string) => void;
  blogSocialSummary: string;
  setBlogSocialSummary: (val: string) => void;
  blogSummaryLoading: boolean;
  setBlogSummaryLoading: (val: boolean) => void;
  blogSocialLoading: boolean;
  setBlogSocialLoading: (val: boolean) => void;
  blogSummaryCached: boolean;
  setBlogSummaryCached: (val: boolean) => void;
  blogSocialCached: boolean;
  setBlogSocialCached: (val: boolean) => void;
  summarizerProvider: string;
  setSummarizerProvider: (val: string) => void;
  summarizerModel: string;
  setSummarizerModel: (val: string) => void;
  blogComments: Comment[];
  isMetadataExpanded: boolean;
  setIsMetadataExpanded: (val: boolean) => void;
  isAiCopilotExpanded: boolean;
  setIsAiCopilotExpanded: (val: boolean) => void;
  isCommentsExpanded: boolean;
  setIsCommentsExpanded: (val: boolean) => void;
  blogEditorTab: "edit" | "preview" | "summarizer";
  setBlogEditorTab: (val: "edit" | "preview" | "summarizer") => void;
  isNewBlog: boolean;
  blogAiPrompt: string;
  setBlogAiPrompt: (val: string) => void;
  blogAiLoading: boolean;
  blogSaving: boolean;
  blogDeleting: boolean;
  uploadingImage: boolean;
  handleUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  commentDeletingId: string | null;
  setFocusContentMode: (val: boolean) => void;
  setMonacoEditor: (editor: any) => void;
  parsedBlogContent: React.ReactNode | null;
  setZoomedBlock: (block: { type: string; code: string; startLine: number; endLine: number } | null) => void;
  previewSubTab: "render" | "console";
  setPreviewSubTab: (val: "render" | "console") => void;
  previewLogs: { id: string; type: string; msg: string; time: string }[];
  setPreviewLogs: (val: { id: string; type: string; msg: string; time: string }[]) => void;
  handleAskAiFix: (logId: string, errorMsg: string) => void;
  fixingErrorId: string | null;
  aiSuggestions: Record<string, string>;
  refreshing: boolean;
  filteredBlogs: Blog[];
  draftCount: number;
  publishedCount: number;
  handleNewBlog: () => void;
  handleSelectBlog: (blog: Blog) => void;
  handleSaveBlog: () => void;
  handleDeleteBlog: () => void;
  handleDeleteComment: (commentId: string) => void;
  handleBlogTitleChange: (val: string) => void;
  handleBlogAiCompose: (mode: "outline" | "polish" | "summary" | "write") => void;
  renderInlinePreview: (type: string, code: string, blockId: string) => React.ReactNode;
  api: (path: string, options?: RequestInit) => Promise<Response>;
}

function BlogsTab({
  blogs,
  selectedBlog,
  setSelectedBlog,
  blogSearchQuery,
  setBlogSearchQuery,
  blogFilterTab,
  setBlogFilterTab,
  blogWords,
  blogTitle,
  blogSlug,
  setBlogSlug,
  blogContent,
  setBlogContent,
  blogSummary,
  setBlogSummary,
  blogTags,
  setBlogTags,
  blogCategory,
  setBlogCategory,
  blogPublished,
  setBlogPublished,
  blogReadTime,
  setBlogReadTime,
  blogCoverImage,
  setBlogCoverImage,
  blogDevtoSummary,
  setBlogDevtoSummary,
  blogSocialSummary,
  setBlogSocialSummary,
  blogSummaryLoading,
  setBlogSummaryLoading,
  blogSocialLoading,
  setBlogSocialLoading,
  blogSummaryCached,
  setBlogSummaryCached,
  blogSocialCached,
  setBlogSocialCached,
  summarizerProvider,
  setSummarizerProvider,
  summarizerModel,
  setSummarizerModel,
  blogComments,
  isMetadataExpanded,
  setIsMetadataExpanded,
  isAiCopilotExpanded,
  setIsAiCopilotExpanded,
  isCommentsExpanded,
  setIsCommentsExpanded,
  blogEditorTab,
  setBlogEditorTab,
  isNewBlog,
  blogAiPrompt,
  setBlogAiPrompt,
  blogAiLoading,
  blogSaving,
  blogDeleting,
  uploadingImage,
  handleUploadImage,
  commentDeletingId,
  setFocusContentMode,
  setMonacoEditor,
  parsedBlogContent,
  setZoomedBlock,
  previewSubTab,
  setPreviewSubTab,
  previewLogs,
  setPreviewLogs,
  handleAskAiFix,
  fixingErrorId,
  aiSuggestions,
  refreshing,
  filteredBlogs,
  draftCount,
  publishedCount,
  handleNewBlog,
  handleSelectBlog,
  handleSaveBlog,
  handleDeleteBlog,
  handleDeleteComment,
  handleBlogTitleChange,
  handleBlogAiCompose,
  renderInlinePreview,
  api,
}: BlogsTabProps) {
  return (
    <>
      {/* Left Column: Blogs List */}
      <div
        className={`md:col-span-4 flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 ${selectedBlog ? "hidden md:flex" : "flex"}`}
        style={{
          background: "var(--glass-bg)",
          borderColor: "var(--border)",
        }}
      >
        {/* Search, Filter & New Post button */}
        <div
          className="p-4 border-b space-y-3 shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={handleNewBlog}
            className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98] shadow-md flex items-center justify-center gap-2 select-none"
            style={{
              background: "var(--accent)",
              color: "var(--bg-primary)",
            }}
          >
            <Plus size={14} /> New Post
          </button>

          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={blogSearchQuery}
              onChange={(e) => setBlogSearchQuery(e.target.value)}
              placeholder="Search blogs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          {/* Filtering tabs */}
          <div
            className="flex p-1 rounded-xl"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {(["all", "drafts", "published"] as const).map((tab) => {
              const active = blogFilterTab === tab;
              const count =
                tab === "all"
                  ? blogs.length
                  : tab === "drafts"
                    ? draftCount
                    : publishedCount;
              return (
                <button
                  key={tab}
                  onClick={() => setBlogFilterTab(tab)}
                  className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: active
                      ? "var(--accent)"
                      : "transparent",
                    color: active
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {tab === "all"
                    ? "All"
                    : tab === "drafts"
                      ? "Drafts"
                      : "Live"}
                  <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List View Scroll Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {refreshing ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted space-y-3">
              <Loader
                size={20}
                className="animate-spin"
                style={{ color: "var(--accent)" }}
              />
              <span className="text-xs">Loading records...</span>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-20">
              <FileText
                size={32}
                className="mx-auto mb-3 opacity-30"
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                No articles found.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredBlogs.map((blog) => {
                const active = selectedBlog?.id === blog.id;
                const isNew = blog.id.startsWith("new-");
                return (
                  <motion.button
                    key={blog.id}
                    layoutId={`blog-${blog.id}`}
                    onClick={() => handleSelectBlog(blog)}
                    className="w-full text-left rounded-xl p-4 transition-all relative border outline-none select-none flex flex-col"
                    style={{
                      background: active
                        ? "var(--accent-dim)"
                        : "var(--bg-card)",
                      borderColor: active
                        ? "var(--accent)"
                        : isNew
                          ? "dashed var(--border)"
                          : "transparent",
                    }}
                    whileHover={{ scale: active ? 1 : 1.01 }}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span
                        className="font-bold text-xs truncate max-w-[170px]"
                        style={{
                          color: active
                            ? "var(--accent)"
                            : "var(--text-primary)",
                        }}
                      >
                        {blog.title || (
                          <span className="italic opacity-50">
                            Untitled Post
                          </span>
                        )}
                      </span>
                      <span
                        className="text-[9px] font-semibold whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {isNew
                          ? "New Draft"
                          : formatDate(blog.created_at).split(",")[0]}
                      </span>
                    </div>

                    <p
                      className="text-xs truncate opacity-85"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {blog.summary || (
                        <span className="italic opacity-40">
                          No summary provided
                        </span>
                      )}
                    </p>

                    <div className="flex items-center justify-between w-full mt-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          style={{
                            background:
                              blog.published === 1
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                            color:
                              blog.published === 1
                                ? "#10b981"
                                : "#f59e0b",
                          }}
                        >
                          {blog.published === 1 ? "Published" : "Draft"}
                        </span>
                        {blog.category && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                            style={{
                              background: "var(--accent-dim)",
                              color: "var(--accent)",
                            }}
                          >
                            {blog.category}
                          </span>
                        )}
                      </div>
                      {!isNew && (
                        <span
                          className="text-[9px] flex items-center gap-1 font-semibold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Heart
                            size={10}
                            className="text-red-500 fill-current"
                          />
                          {blog.likes} likes
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Right Column: Blog Creator / Editor Panel */}
      <div
        className={`md:col-span-8 flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 ${selectedBlog ? "flex" : "hidden md:flex"}`}
        style={{
          background: "var(--glass-bg)",
          borderColor: "var(--border)",
        }}
      >
        {selectedBlog ? (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Header bar */}
            <div
              className="px-5 py-2 border-b shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedBlog(null)}
                    className="md:hidden w-8 h-8 rounded-full flex items-center justify-center border shrink-0"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <h3 className="text-sm font-bold truncate">
                    {isNewBlog
                      ? "New Post Creator"
                      : `Editing: ${blogTitle}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleSaveBlog}
                  disabled={
                    blogSaving ||
                    !blogTitle ||
                    !blogSlug ||
                    !blogContent
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "var(--accent)",
                    color: "var(--bg-primary)",
                    opacity:
                      blogSaving ||
                      !blogTitle ||
                      !blogSlug ||
                      !blogContent
                        ? 0.6
                        : 1,
                  }}
                >
                  {blogSaving && (
                    <Loader size={11} className="animate-spin" />
                  )}
                  Save Changes
                </button>
              </div>

              {/* Edit / Preview / Summarizer Tabs */}
              <div className="flex p-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider w-fit"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-secondary)",
                }}
              >
                <button
                  onClick={() => setBlogEditorTab("edit")}
                  className="px-3 py-1.5 rounded flex items-center gap-1 whitespace-nowrap"
                  style={{
                    background:
                      blogEditorTab === "edit"
                        ? "var(--accent)"
                        : "transparent",
                    color:
                      blogEditorTab === "edit"
                        ? "var(--bg-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  <Edit size={10} /> Edit
                </button>
                <button
                  onClick={() => setBlogEditorTab("preview")}
                  className="px-3 py-1.5 rounded flex items-center gap-1 whitespace-nowrap"
                  style={{
                    background:
                      blogEditorTab === "preview"
                        ? "var(--accent)"
                        : "transparent",
                    color:
                      blogEditorTab === "preview"
                        ? "var(--bg-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  <Eye size={10} /> Live Preview
                </button>
                <button
                  onClick={() => setBlogEditorTab("summarizer")}
                  className="px-3 py-1.5 rounded flex items-center gap-1 whitespace-nowrap"
                  style={{
                    background:
                      blogEditorTab === "summarizer"
                        ? "var(--accent)"
                        : "transparent",
                    color:
                      blogEditorTab === "summarizer"
                        ? "var(--bg-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  <Sparkles size={10} /> Summarizer
                </button>
              </div>
            </div>

            {/* Scrollable Form Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {blogEditorTab === "edit" ? (
                /* Edit Form */
                <div className="space-y-4">
                  <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                    <button
                      type="button"
                      onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={16} style={{ color: "var(--accent)" }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                          Post Metadata
                        </span>
                      </div>
                      {isMetadataExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    <AnimatePresence>
                      {isMetadataExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                            Article Title *
                          </label>
                          <input
                            type="text"
                            value={blogTitle}
                            onChange={(e) =>
                              handleBlogTitleChange(e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl text-xs border"
                            style={{
                              background: "var(--bg-card)",
                              color: "var(--text-primary)",
                              borderColor: "var(--border)",
                            }}
                            placeholder="Enter an engaging title..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                            URL Slug *
                          </label>
                          <input
                            type="text"
                            value={blogSlug}
                            onChange={(e) =>
                              setBlogSlug(slugify(e.target.value))
                            }
                            className="w-full px-4 py-2.5 rounded-xl text-xs border font-mono"
                            style={{
                              background: "var(--bg-card)",
                              color: "var(--text-primary)",
                              borderColor: "var(--border)",
                            }}
                            placeholder="my-slug-path"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                            Tags (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={blogTags}
                            onChange={(e) => setBlogTags(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-xs border"
                            style={{
                              background: "var(--bg-card)",
                              color: "var(--text-primary)",
                              borderColor: "var(--border)",
                            }}
                            placeholder="React, TypeScript, CSS"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                            Category
                          </label>
                          <select
                            value={blogCategory}
                            onChange={(e) =>
                              setBlogCategory(e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl text-xs border appearance-none cursor-pointer"
                            style={{
                              background: "var(--bg-card)",
                              color: "var(--text-primary)",
                              borderColor: "var(--border)",
                            }}
                          >
                            <option value="General">General</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Tutorial">Tutorial</option>
                            <option value="Architecture">
                              Architecture
                            </option>
                            <option value="DevOps">DevOps</option>
                            <option value="Security">Security</option>
                            <option value="Career">Career</option>
                            <option value="Workflow">Workflow</option>
                            <option value="Productivity">
                              Productivity
                            </option>
                            <option value="Design">Design</option>
                            <option value="Life">Life</option>
                            <option value="Thoughts">Thoughts</option>
                            <option value="Hobbies">Hobbies</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                            Reading Time
                          </label>
                          <input
                            type="text"
                            value={blogReadTime}
                            onChange={(e) =>
                              setBlogReadTime(e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl text-xs border"
                            style={{
                              background: "var(--bg-card)",
                              color: "var(--text-primary)",
                              borderColor: "var(--border)",
                            }}
                            placeholder="5 min read"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60">
                              Cover Image URL
                            </label>
                            <label className={`cursor-pointer px-2 py-1 rounded text-[10px] uppercase font-bold flex items-center gap-1 transition-all ${uploadingImage ? 'opacity-50' : 'hover:opacity-80'}`} style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
                              {uploadingImage ? <Loader size={10} className="animate-spin" /> : <Upload size={10} />}
                              Upload
                              <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={uploadingImage} />
                            </label>
                          </div>
                          <input
                            type="text"
                            value={blogCoverImage}
                            onChange={(e) =>
                              setBlogCoverImage(e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl text-xs border"
                            style={{
                              background: "var(--bg-card)",
                              color: "var(--text-primary)",
                              borderColor: "var(--border)",
                            }}
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                          Excerpt / Brief Summary
                        </label>
                        <input
                          type="text"
                          value={blogSummary}
                          onChange={(e) => setBlogSummary(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-xs border"
                          style={{
                            background: "var(--bg-card)",
                            color: "var(--text-primary)",
                            borderColor: "var(--border)",
                          }}
                          placeholder="Brief summary displayed in the search feed cards..."
                        />
                      </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                                Markdown Body Content *
                              </label>
                              <button
                                type="button"
                                onClick={() => setFocusContentMode(true)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border hover:brightness-110 transition-all"
                                style={{
                                  background: "var(--bg-card)",
                                  borderColor: "var(--border)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                <Maximize2 size={10} /> Focus Mode
                              </button>
                            </div>

                            <div
                              className="rounded-xl border overflow-hidden"
                              style={{
                                borderColor: "var(--border)",
                                height: "350px",
                              }}
                            >
                              <MarkdownEditor
                                value={blogContent}
                                onChange={setBlogContent}
                                height="350px"
                                autoFocus
                                onEditorMount={setMonacoEditor}
                                extraWords={blogWords}
                                showToolbar
                                renderInlinePreview={renderInlinePreview}
                                onZoomBlock={setZoomedBlock}
                              />
                            </div>
                          </div>

                          {/* AI Copilot Writing Panel */}
                          <div
                            className="p-5 rounded-2xl border"
                            style={{
                              background: "var(--accent-secondary-dim)",
                              borderColor: "rgba(204, 160, 61, 0.15)",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setIsAiCopilotExpanded(!isAiCopilotExpanded)}
                              className="flex items-center justify-between w-full"
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles
                                  size={16}
                                  style={{ color: "var(--accent)" }}
                                />
                                <span
                                  className="text-xs font-bold uppercase tracking-wider"
                                  style={{ color: "var(--accent)" }}
                                >
                                  AI Blog Copilot (Gemini)
                                </span>
                              </div>
                              {isAiCopilotExpanded ? <ChevronUp size={16} style={{ color: "var(--accent)" }} /> : <ChevronDown size={16} style={{ color: "var(--accent)" }} />}
                            </button>

                            <AnimatePresence>
                              {isAiCopilotExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-4">
                                    <div className="grid grid-cols-3 gap-2 mb-3 select-none">
                              <button
                                type="button"
                                onClick={() => handleBlogAiCompose("outline")}
                                disabled={blogAiLoading}
                                className="px-3 py-2 rounded-xl text-[10px] font-bold border hover:brightness-110 active:scale-[0.98] transition-all bg-[var(--bg-card)] border-[var(--border)]"
                              >
                                Generate Outline
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBlogAiCompose("polish")}
                                disabled={blogAiLoading || !blogContent}
                                className="px-3 py-2 rounded-xl text-[10px] font-bold border hover:brightness-110 active:scale-[0.98] transition-all bg-[var(--bg-card)] border-[var(--border)] disabled:opacity-50"
                              >
                                Polish Content
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBlogAiCompose("summary")}
                                disabled={blogAiLoading || !blogContent}
                                className="px-3 py-2 rounded-xl text-[10px] font-bold border hover:brightness-110 active:scale-[0.98] transition-all bg-[var(--bg-card)] border-[var(--border)] disabled:opacity-50"
                              >
                                Summarize Summary
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={blogAiPrompt}
                                onChange={(e) =>
                                  setBlogAiPrompt(e.target.value)
                                }
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs border"
                                style={{
                                  background: "var(--bg-card)",
                                  color: "var(--text-primary)",
                                  borderColor: "var(--border)",
                                }}
                                placeholder="Type manual instructions for custom section drafting..."
                              />
                              <button
                                type="button"
                                onClick={() => handleBlogAiCompose("write")}
                                disabled={blogAiLoading || !blogAiPrompt}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-[var(--bg-primary)] disabled:opacity-60 shrink-0 min-w-[80px]"
                              >
                                {blogAiLoading ? (
                                  <Loader size={12} className="animate-spin" />
                                ) : (
                                  "Write"
                                )}
                              </button>
                            </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Published Status Toggle */}
                          <div className="flex items-center gap-3 py-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={blogPublished}
                                onChange={(e) =>
                                  setBlogPublished(e.target.checked)
                                }
                                className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                              />
                              <span className="text-xs font-semibold">
                                Publish Post (visible on public `/blogs` page)
                              </span>
                            </label>
                          </div>
                        </div>
                      ) : blogEditorTab === "summarizer" ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} style={{ color: "var(--accent)" }} />
                            <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                              AI Summarizer
                            </h4>
                          </div>
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            Generate summaries you can copy-paste to social platforms. Once generated, they are cached — regenerating costs tokens again.
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Provider:</label>
                              <select
                                value={summarizerProvider}
                                onChange={(e) => setSummarizerProvider(e.target.value)}
                                className="px-2 py-1 rounded-lg border text-[10px] outline-none"
                                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                              >
                                <option value="">Default (from settings)</option>
                                <option value="gemini">Gemini</option>
                                <option value="puter">Puter</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Model:</label>
                              <select
                                value={summarizerModel}
                                onChange={(e) => setSummarizerModel(e.target.value)}
                                className="px-2 py-1 rounded-lg border text-[10px] outline-none"
                                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                              >
                                <option value="">Default (from settings)</option>
                                {summarizerProvider === 'puter' ? (
                                  <>
                                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                                    <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                                    <option value="gemini-3-pro-preview">Gemini 3 Pro Preview</option>
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                  </>
                                )}
                              </select>
                            </div>
                          </div>

                          {/* Dev.to Summary */}
                          <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: "var(--border)" }}>
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                Dev.to Summary
                              </h5>
                              <div className="flex items-center gap-2">
                                {blogDevtoSummary && (
                                  <button
                                    onClick={() => navigator.clipboard.writeText(blogDevtoSummary)}
                                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-95"
                                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                                  >
                                    Copy
                                  </button>
                                )}
                                {blogSummaryCached && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                                    Cached
                                  </span>
                                )}
                                <button
                                  onClick={async () => {
                                    if (!selectedBlog) return
                                    setBlogSummaryLoading(true)
                                    try {
                                      const provider = summarizerProvider || undefined
                                      const model = summarizerModel || undefined
                                      const params = new URLSearchParams()
                                      if (provider) params.set('provider', provider)
                                      if (model) params.set('model', model)
                                      params.set('force', '1')
                                      const res = await api(`/api/admin/blogs/${selectedBlog.id}/devto-summary?${params.toString()}`, { method: 'POST' })
                                      if (!res.ok) return
                                      const data = await res.json()

                                      await loadPuter()
                                      if (data.client_side && (window as any).puter?.ai?.chat) {
                                        const prompt = `Write a short Dev.to blog post summarizing this technical article. Match this EXACT style:\n\n1. Start with a hook — casual, first person\n2. Say what the article covers in plain language\n3. Include 5-8 bullet points of key technical highlights\n4. End with a one-liner about real-world issues\n5. Finish with CTA: "Read the full article here:" followed by the link on its own line\n\nRules:\n- Max 250 words\n- No title, no front matter, no hashtags in body\n- Use markdown bullet points (- item)\n\nFull article URL: ${window.location.origin}/blogs/${selectedBlog.slug}\n\nArticle title: ${data.title}\n\nArticle content:\n${data.body_markdown}`
                                        const aiResult: any = await (window as any).puter.ai.chat(prompt, { model: summarizerModel || undefined })
                                        const summary = typeof aiResult === "string" ? aiResult : String(aiResult)
                                        if (summary) {
                                          await api(`/api/admin/blogs/${selectedBlog.id}/save-summary`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ type: 'devto', body_markdown: summary }),
                                          })
                                          setBlogDevtoSummary(summary)
                                          setBlogSummaryCached(false)
                                        }
                                      } else {
                                        setBlogDevtoSummary(data.body_markdown)
                                        setBlogSummaryCached(false)
                                      }
                                    } catch {} finally {
                                      setBlogSummaryLoading(false)
                                    }
                                  }}
                                  disabled={blogSummaryLoading || !selectedBlog}
                                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-95"
                                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                                >
                                  {blogSummaryLoading ? "..." : "Generate"}
                                </button>
                              </div>
                            </div>
                            {blogDevtoSummary ? (
                              <div className="p-3 rounded-lg text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto select-text" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                                {blogDevtoSummary}
                              </div>
                            ) : (
                              <p className="text-[11px] italic" style={{ color: "var(--text-muted)" }}>
                                No Dev.to summary yet. Click Generate to create one.
                              </p>
                            )}
                            {blogDevtoSummary && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Refine: make it shorter / more casual / add emojis..."
                                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] border outline-none"
                                  style={{ background: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border)" }}
                                  onKeyDown={async (e) => {
                                    if (e.key !== 'Enter' || !selectedBlog) return
                                    const input = e.currentTarget
                                    const instruction = input.value.trim()
                                    if (!instruction) return
                                    input.disabled = true
                                    try {
                                      await loadPuter()
                                      const usePuter = (summarizerProvider || '') === 'puter' && (window as any).puter?.ai?.chat
                                      if (usePuter) {
                                        const prompt = `Here is a Dev.to summary of a technical article. Based on this instruction, rewrite the summary accordingly. Return ONLY the rewritten summary.\n\nInstruction: ${instruction}\n\nCurrent summary:\n${blogDevtoSummary}`
                                        const aiResult: any = await (window as any).puter.ai.chat(prompt, { model: summarizerModel || undefined })
                                        const refined = typeof aiResult === "string" ? aiResult : String(aiResult)
                                        if (refined) {
                                          await api(`/api/admin/blogs/${selectedBlog.id}/save-summary`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ type: 'devto', body_markdown: refined }),
                                          })
                                          setBlogDevtoSummary(refined)
                                          setBlogSummaryCached(false)
                                          input.value = ''
                                        }
                                      } else {
                                        const res = await api(`/api/admin/blogs/${selectedBlog.id}/refine-summary`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ type: 'devto', instruction, model: summarizerModel || undefined }),
                                        })
                                        if (res.ok) {
                                          const data = await res.json()
                                          setBlogDevtoSummary(data.body_markdown)
                                          setBlogSummaryCached(false)
                                          input.value = ''
                                        }
                                      }
                                    } catch {} finally {
                                      input.disabled = false
                                      input.focus()
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Social Summary (LinkedIn / Facebook) */}
                          <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: "var(--border)" }}>
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                LinkedIn / Facebook Summary
                              </h5>
                              <div className="flex items-center gap-2">
                                {blogSocialSummary && (
                                  <button
                                    onClick={() => navigator.clipboard.writeText(blogSocialSummary)}
                                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-95"
                                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                                  >
                                    Copy
                                  </button>
                                )}
                                {blogSocialCached && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                                    Cached
                                  </span>
                                )}
                                <button
                                  onClick={async () => {
                                    if (!selectedBlog) return
                                    setBlogSocialLoading(true)
                                    try {
                                      const provider = summarizerProvider || undefined
                                      const model = summarizerModel || undefined
                                      const params = new URLSearchParams()
                                      if (provider) params.set('provider', provider)
                                      if (model) params.set('model', model)
                                      params.set('force', '1')
                                      const res = await api(`/api/admin/blogs/${selectedBlog.id}/social-summary?${params.toString()}`, { method: 'POST' })
                                      if (!res.ok) return
                                      const data = await res.json()

                                      await loadPuter()
                                      if (data.client_side && (window as any).puter?.ai?.chat) {
                                        const prompt = `Write a social media summary of this technical article suitable for LinkedIn and Facebook.\n\n1. Start with a hook — professional, engaging, first person\n2. 2-3 sentences explaining what it covers\n3. 3-4 bullet points of key takeaways\n4. End with: "Read the full article here: ${window.location.origin}/blogs/${selectedBlog.slug}"\n\nRules:\n- Max 200 words\n- No hashtags, no markdown\n- Use "—" dashes for bullet points\n\nArticle title: ${data.title}\n\nArticle content:\n${data.body_markdown}`
                                        const aiResult: any = await (window as any).puter.ai.chat(prompt, { model: summarizerModel || undefined })
                                        const summary = typeof aiResult === "string" ? aiResult : String(aiResult)
                                        if (summary) {
                                          await api(`/api/admin/blogs/${selectedBlog.id}/save-summary`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ type: 'social', body_markdown: summary }),
                                          })
                                          setBlogSocialSummary(summary)
                                          setBlogSocialCached(false)
                                        }
                                      } else {
                                        setBlogSocialSummary(data.body_markdown)
                                        setBlogSocialCached(false)
                                      }
                                    } catch {} finally {
                                      setBlogSocialLoading(false)
                                    }
                                  }}
                                  disabled={blogSocialLoading || !selectedBlog}
                                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-95"
                                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                                >
                                  {blogSocialLoading ? "..." : "Generate"}
                                </button>
                              </div>
                            </div>
                            {blogSocialSummary ? (
                              <div className="p-3 rounded-lg text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto select-text" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                                {blogSocialSummary}
                              </div>
                            ) : (
                              <p className="text-[11px] italic" style={{ color: "var(--text-muted)" }}>
                                No social summary yet. Click Generate to create one.
                              </p>
                            )}
                            {blogSocialSummary && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Refine: make it shorter / more casual / add emojis..."
                                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] border outline-none"
                                  style={{ background: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border)" }}
                                  onKeyDown={async (e) => {
                                    if (e.key !== 'Enter' || !selectedBlog) return
                                    const input = e.currentTarget
                                    const instruction = input.value.trim()
                                    if (!instruction) return
                                    input.disabled = true
                                    try {
                                      await loadPuter()
                                      const usePuter = (summarizerProvider || '') === 'puter' && (window as any).puter?.ai?.chat
                                      if (usePuter) {
                                        const prompt = `Here is a social media summary of a technical article. Based on this instruction, rewrite the summary accordingly. Return ONLY the rewritten summary.\n\nInstruction: ${instruction}\n\nCurrent summary:\n${blogSocialSummary}`
                                        const aiResult: any = await (window as any).puter.ai.chat(prompt, { model: summarizerModel || undefined })
                                        const refined = typeof aiResult === "string" ? aiResult : String(aiResult)
                                        if (refined) {
                                          await api(`/api/admin/blogs/${selectedBlog.id}/save-summary`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ type: 'social', body_markdown: refined }),
                                          })
                                          setBlogSocialSummary(refined)
                                          setBlogSocialCached(false)
                                          input.value = ''
                                        }
                                      } else {
                                        const res = await api(`/api/admin/blogs/${selectedBlog.id}/refine-summary`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ type: 'social', instruction, model: summarizerModel || undefined }),
                                        })
                                        if (res.ok) {
                                          const data = await res.json()
                                          setBlogSocialSummary(data.body_markdown)
                                          setBlogSocialCached(false)
                                          input.value = ''
                                        }
                                      }
                                    } catch {} finally {
                                      input.disabled = false
                                      input.focus()
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Live Preview with Console Tab */
                        <div
                          className="p-5 rounded-3xl border select-text flex flex-col"
                          style={{
                            background: "var(--bg-card)",
                            borderColor: "var(--border)",
                            minHeight: "500px",
                          }}
                        >
                          {/* Sub-tabs for Preview */}
                          <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPreviewSubTab("render")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  previewSubTab === "render" ? "bg-[var(--accent)] text-[var(--bg-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                                }`}
                              >
                                <Eye size={12} className="inline mr-1" /> Rendered View
                              </button>
                              <button
                                onClick={() => setPreviewSubTab("console")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  previewSubTab === "console" ? "bg-[var(--accent)] text-[var(--bg-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                                }`}
                              >
                                <Monitor size={12} /> Console
                                {previewLogs.length > 0 && (
                                  <span className="ml-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[9px]">
                                    {previewLogs.length}
                                  </span>
                                )}
                              </button>
                            </div>
                            {previewSubTab === "console" && previewLogs.length > 0 && (
                              <button
                                onClick={() => setPreviewLogs([])}
                                className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                              >
                                Clear Logs
                              </button>
                            )}
                          </div>

                          {previewSubTab === "render" ? (
                            <div className="prose max-w-none flex-1">
                              <h1 className="text-3xl font-bold mb-4">
                                {blogTitle || "Untitled Article"}
                              </h1>
                              <div
                                className="flex items-center gap-4 text-xs opacity-60 mb-6 pb-4 border-b"
                                style={{ borderColor: "var(--border)" }}
                              >
                                <span>Read time: {blogReadTime || "5 min read"}</span>
                                {blogTags && <span>Tags: {blogTags}</span>}
                              </div>

                              {parsedBlogContent ? (
                                parsedBlogContent
                              ) : (
                                <p className="italic text-center text-xs opacity-50 py-10">
                                  No markdown content written yet.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col gap-3">
                              {/* Markdown Context Banner */}
                              <div className="p-3 rounded-xl flex items-start gap-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                                <div className="p-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg-primary)]">
                                  <Monitor size={14} />
                                </div>
                                <div>
                                  <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Markdown Interactive Blocks Console</h4>
                                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                                    This console captures runtime errors specifically from your custom markdown editor blocks (Interactive, 3D, Chart, Mermaid). Check the code inside your markdown blocks to fix these issues.
                                  </p>
                                </div>
                              </div>

                              <div className="flex-1 bg-black rounded-xl p-4 overflow-y-auto font-mono text-[11px] leading-relaxed border border-gray-800">
                                {previewLogs.length === 0 ? (
                                  <p className="text-gray-500 italic">No errors or logs captured. Switch back to "Rendered View" to run your interactive blocks.</p>
                                ) : (
                                  <div className="space-y-4">
                                    {previewLogs.map((log) => (
                                      <div key={log.id} className="pb-4 border-b border-gray-800/50">
                                        <div className="flex gap-3">
                                          <span className="text-gray-500 shrink-0 w-16">{log.time}</span>
                                          <span className={`flex-1 whitespace-pre-wrap ${
                                            log.type === "error" ? "text-red-400" :
                                            log.type === "warn" ? "text-yellow-400" :
                                            "text-blue-300"
                                          }`}>
                                            {log.msg}
                                          </span>
                                        </div>

                                        {/* Hardcoded Tip for Common Error */}
                                        {log.type === "error" && log.msg.includes("THREE.CSS2DObject is not a constructor") && (
                                          <div className="mt-2 ml-19 p-2 rounded bg-gray-900 border border-gray-700 text-gray-300">
                                            💡 <strong>Tip:</strong> Remove the <code>THREE.</code> namespace. Import and use <code>CSS2DObject</code> directly.
                                          </div>
                                        )}

                                        {/* Ask AI Section */}
                                        {log.type === "error" && (
                                          <div className="mt-2 ml-19">
                                            {!aiSuggestions[log.id] && fixingErrorId !== log.id && (
                                              <button
                                                onClick={() => handleAskAiFix(log.id, log.msg)}
                                                className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors border border-indigo-500/30 font-sans text-[10px] font-bold"
                                              >
                                                <Sparkles size={10} /> Ask AI to Fix
                                              </button>
                                            )}

                                            {fixingErrorId === log.id && (
                                              <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-sans">
                                                <Loader size={10} className="animate-spin" /> Analyzing markdown block...
                                              </div>
                                            )}

                                            {aiSuggestions[log.id] && (
                                              <div className="mt-2 p-3 rounded bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 font-sans">
                                                <div className="flex items-center gap-1.5 font-bold mb-1.5 text-indigo-300">
                                                  <Sparkles size={10} /> AI Fix Suggestion:
                                                </div>
                                                <div className="whitespace-pre-wrap leading-relaxed opacity-90">
                                                  {aiSuggestions[log.id]}
                                                </div>
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
                          )}
                        </div>
                      )}

                      {/* Comments Moderation Panel (Underneath the editor, only if post exists in DB) */}
                      {!isNewBlog && (
                        <div
                          className="pt-8 border-t border-dashed space-y-4"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <button
                            type="button"
                            onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                            className="flex items-center justify-between w-full p-3 rounded-xl border transition-colors hover:bg-white/5"
                            style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare
                                size={16}
                                style={{ color: "var(--accent)" }}
                              />
                              <span
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Comment Moderation ({blogComments.length})
                              </span>
                            </div>
                            {isCommentsExpanded ? <ChevronUp size={16} style={{ color: "var(--text-secondary)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-secondary)" }} />}
                          </button>

                          <AnimatePresence>
                            {isCommentsExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-2">
                                  {blogComments.length === 0 ? (
                            <p className="text-xs italic opacity-40">
                              No comments posted on this article.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {blogComments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="p-4 rounded-xl border flex items-start justify-between gap-4"
                                  style={{
                                    background: "var(--bg-secondary)",
                                    borderColor: "var(--border)",
                                  }}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold">
                                        {comment.author_name}
                                      </span>
                                      {comment.author_email && (
                                        <span
                                          className="text-[10px]"
                                          style={{ color: "var(--accent)" }}
                                        >
                                          ({comment.author_email})
                                        </span>
                                      )}
                                      <span className="text-[9px] opacity-55">
                                        {formatDate(comment.created_at, { time: true })}
                                      </span>
                                    </div>
                                    <p className="text-xs opacity-90 select-text leading-relaxed">
                                      {comment.content}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteComment(comment.id)
                                    }
                                    disabled={commentDeletingId === comment.id}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 shrink-0"
                                    title="Delete Comment"
                                  >
                                    {commentDeletingId === comment.id ? (
                                      <Loader
                                        size={12}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Trash2 size={13} />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div
                      className="px-5 py-4 border-t flex items-center justify-between shrink-0 select-none"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <button
                        type="button"
                        onClick={handleDeleteBlog}
                        disabled={blogDeleting || isNewBlog}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:bg-red-500/10 hover:border-red-500/30 text-red-500 disabled:opacity-30"
                      >
                        {blogDeleting ? (
                          <Loader size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Delete Post
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                    <FileText
                      size={48}
                      className="mb-4 opacity-25 animate-pulse"
                      style={{ color: "var(--accent)" }}
                    />
                    <h4 className="text-sm font-bold mb-1">
                      Select an Article
                    </h4>
                    <p
                      className="text-xs max-w-xs leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Click on a blog post to modify its content, manage
                      comments, or compose layouts with AI assist. Click "New
                      Post" to create a new draft.
                    </p>
                  </div>
                )}
              </div>
            </>
  );
}

export default React.memo(BlogsTab);

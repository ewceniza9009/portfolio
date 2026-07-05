import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Loader,
  ArrowLeft,
  Search,
  Sparkles,
  Check,
  Copy,
  Inbox,
  Cpu,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "../../utils/format";
import { AI_PRESETS } from "./helpers";
import type { Message } from "../../types/blog";

interface MessagesTabProps {
  refreshing: boolean;
  selected: Message | null;
  setSelected: (msg: Message | null) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterTab: "all" | "unreplied" | "replied";
  setFilterTab: (val: "all" | "unreplied" | "replied") => void;
  copiedEmail: boolean;
  setCopiedEmail: (val: boolean) => void;
  replySubject: string;
  setReplySubject: (val: string) => void;
  replyBody: string;
  setReplyBody: (val: string) => void;
  sending: boolean;
  setSending: (val: boolean) => void;
  aiLoading: boolean;
  setAiLoading: (val: boolean) => void;
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  defaultAiModel: string;
  filteredMessages: Message[];
  inboxCount: number;
  repliedCount: number;
  handleSendReply: () => void;
  handleAiCompose: (prompt?: string) => void;
  handleCopyEmail: (email: string) => void;
  handleDeleteMessage: (id: string) => void;
}

function MessagesTab({
  refreshing,
  selected,
  setSelected,
  searchQuery,
  setSearchQuery,
  filterTab,
  setFilterTab,
  copiedEmail,
  replySubject,
  setReplySubject,
  replyBody,
  setReplyBody,
  sending,
  aiLoading,
  aiPrompt,
  setAiPrompt,
  defaultAiModel,
  filteredMessages,
  inboxCount,
  repliedCount,
  handleSendReply,
  handleAiCompose,
  handleCopyEmail,
  handleDeleteMessage,
  messages,
}: MessagesTabProps) {
  return (
    <>
      {/* Left Column: Messages List */}
      <div
        className={`md:col-span-4 flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 ${selected ? "hidden md:flex" : "flex"}`}
        style={{
          background: "var(--glass-bg)",
          borderColor: "var(--border)",
        }}
      >
        {/* Search and Tabs Container */}
        <div
          className="p-4 border-b space-y-3 shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inbox..."
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
            {(["all", "unreplied", "replied"] as const).map((tab) => {
              const active = filterTab === tab;
              const count =
                tab === "all"
                  ? messages.length
                  : tab === "unreplied"
                    ? inboxCount
                    : repliedCount;
              return (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
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
                    : tab === "unreplied"
                      ? "Inbox"
                      : "Sent"}
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
              <span className="text-xs">Fetching records...</span>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-20">
              <Inbox
                size={32}
                className="mx-auto mb-3 opacity-30"
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                No messages found.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredMessages.map((msg) => {
                const active = selected?.id === msg.id;
                return (
                  <motion.button
                    key={msg.id}
                    layoutId={`card-${msg.id}`}
                    onClick={() => {
                      setSelected(msg);
                      setReplySubject(
                        msg.reply_subject ||
                          `Re: ${msg.subject || "Contact Form Message"}`,
                      );
                    }}
                    className="w-full text-left rounded-xl p-4 transition-all relative border outline-none select-none flex flex-col"
                    style={{
                      background: active
                        ? "var(--accent-dim)"
                        : "var(--bg-card)",
                      borderColor: active
                        ? "var(--accent)"
                        : "transparent",
                    }}
                    whileHover={{ scale: active ? 1 : 1.01 }}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span
                        className="font-bold text-xs truncate max-w-[150px]"
                        style={{
                          color: active
                            ? "var(--accent)"
                            : "var(--text-primary)",
                        }}
                      >
                        {msg.name}
                      </span>
                      <span
                        className="text-[9px] font-semibold whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatDate(msg.created_at).split(",")[0]}
                      </span>
                    </div>
                    {msg.subject && (
                      <p
                        className="text-[11px] font-semibold truncate mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {msg.subject}
                      </p>
                    )}
                    <p
                      className="text-xs truncate opacity-70 mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {msg.message}
                    </p>

                    {msg.replied === 0 ? (
                      <span
                        className="absolute top-2 right-2 w-2 h-2 rounded-full shadow"
                        style={{ background: "var(--accent)" }}
                      />
                    ) : (
                      <span
                        className="text-[9px] self-start px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1"
                        style={{
                          background: "var(--accent-dim)",
                          color: "var(--accent)",
                        }}
                      >
                        Replied
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Right Column: Message details & composer */}
      <div
        className={`md:col-span-8 flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 ${selected ? "flex" : "hidden md:flex"}`}
        style={{
          background: "var(--glass-bg)",
          borderColor: "var(--border)",
        }}
      >
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            <div
              className="p-5 border-b flex items-center justify-between shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="md:hidden w-8 h-8 rounded-full flex items-center justify-center border"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <ArrowLeft size={14} />
                </button>
                <div>
                  <h3 className="text-sm font-bold">{selected.name}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--accent)" }}
                    >
                      {selected.email}
                    </span>
                    <button
                      onClick={() => handleCopyEmail(selected.email)}
                      className="p-1 hover:brightness-125 transition-all text-muted"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {copiedEmail ? (
                        <Check size={11} className="text-green-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatDate(selected.created_at, { time: true })}
                </span>
                <button
                  onClick={() => handleDeleteMessage(selected.id)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div
                className="p-5 rounded-2xl border flex flex-col"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="flex items-center justify-between border-b pb-3 mb-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span
                    className="text-[10px] uppercase font-bold tracking-widest text-muted"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Original Inquiry
                  </span>
                  {selected.subject && (
                    <span className="text-xs font-semibold">
                      Subject: {selected.subject}
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </p>
              </div>

              {selected.replied === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl border flex flex-col"
                  style={{
                    background: "var(--accent-dim)",
                    borderColor: "var(--accent)",
                  }}
                >
                  <div
                    className="flex items-center justify-between border-b pb-3 mb-3"
                    style={{ borderColor: "var(--accent)" }}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={14}
                        style={{ color: "var(--accent)" }}
                      />
                      <span
                        className="text-[10px] uppercase font-bold tracking-widest"
                        style={{ color: "var(--accent)" }}
                      >
                        Sent Reply
                      </span>
                    </div>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Replied on {formatDate(selected.replied_at!, { time: true })}
                    </span>
                  </div>
                  <p className="text-xs font-bold mb-2">
                    Subject: {selected.reply_subject}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed opacity-95">
                    {selected.reply_body}
                  </p>
                </motion.div>
              )}

              <div
                className="space-y-6 pt-4 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare
                    size={16}
                    style={{ color: "var(--accent)" }}
                  />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {selected.replied === 1
                      ? "Send Follow-up Reply"
                      : "Compose Reply"}
                  </span>
                </div>

                <div
                  className="p-5 rounded-2xl border"
                  style={{
                    background: "var(--accent-secondary-dim)",
                    borderColor: "rgba(204, 160, 61, 0.15)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        size={16}
                        style={{ color: "var(--accent)" }}
                      />
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--accent)" }}
                      >
                        AI Copilot Autocomposer
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-secondary)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <Cpu
                        size={12}
                        style={{ color: "var(--accent)" }}
                      />
                      <span>{defaultAiModel}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {AI_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAiCompose(preset.prompt)}
                        disabled={aiLoading}
                        className="px-3 py-2 rounded-xl text-[10px] font-bold text-center border transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                        style={{
                          background: "var(--bg-card)",
                          borderColor: "var(--border)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs"
                      style={{
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                      }}
                      placeholder="Type custom instructions (e.g., Ask him to meet next Friday)..."
                    />
                    <button
                      onClick={() => handleAiCompose()}
                      disabled={aiLoading || !aiPrompt}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center shrink-0 min-w-[80px]"
                      style={{
                        background: "var(--accent)",
                        color: "var(--bg-primary)",
                        opacity: aiLoading || !aiPrompt ? 0.6 : 1,
                      }}
                    >
                      {aiLoading ? (
                        <Loader size={12} className="animate-spin" />
                      ) : (
                        "Generate"
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold tracking-widest mb-1.5 opacity-60">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                      }}
                      placeholder="Re: ..."
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold tracking-widest mb-1.5 opacity-60">
                      Email Body
                    </label>
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={7}
                      className="w-full px-4 py-3 rounded-xl text-sm resize-none custom-scrollbar"
                      style={{
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                      }}
                      placeholder="Draft your reply message here..."
                    />
                  </div>

                  <div
                    className="flex items-center justify-between pt-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !replySubject || !replyBody}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs font-bold transition-all hover:brightness-110 active:scale-[0.98] shadow-md"
                      style={{
                        background: "var(--accent)",
                        color: "var(--bg-primary)",
                        opacity:
                          sending || !replySubject || !replyBody
                            ? 0.65
                            : 1,
                      }}
                    >
                      {sending ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      {sending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
            <Inbox
              size={48}
              className="mb-4 opacity-25 animate-pulse"
              style={{ color: "var(--accent)" }}
            />
            <h4 className="text-sm font-bold mb-1">
              Select an Inquiry
            </h4>
            <p
              className="text-xs max-w-xs leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Click on a card from the left panel to review developer
              inquiries, copy addresses, and compose AI-assisted
              replies.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default React.memo(MessagesTab);

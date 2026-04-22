"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Database,
  ChevronDown,
  ChevronUp,
  BookOpen,
  BarChart3,
  School,
  FlaskConical,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id:      number;
  role:    "user" | "assistant";
  content: string;
}

interface Source {
  type: string;
  label: string;
  detail: string;
}

// ── Suggested prompts ─────────────────────────────────────────────────────────

const SUGGESTED = [
  "Am I competitive for UT Southwestern?",
  "What ECs should I prioritize this semester?",
  "Compare my stats to last year's UT acceptees",
  "What's the difference between TMDSAS and AMCAS?",
];

// ── Source chip icon map ──────────────────────────────────────────────────────

const SOURCE_ICON: Record<string, React.ReactNode> = {
  profile:         <BookOpen     size={11} />,
  saved_schools:   <BookOpen     size={11} />,
  schools:         <School       size={11} />,
  ut_outcomes:     <BarChart3    size={11} />,
  acceptance_grid: <Database     size={11} />,
  interview_data:  <FlaskConical size={11} />,
};

// ── Simple markdown renderer (bold + bullets + headings) ──────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i} className="text-white font-semibold">{bold[1]}</strong>;
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    const bullet = line.match(/^[-*]\s+(.+)/);
    if (bullet) {
      return (
        <li key={i} className="ml-4 list-disc text-white/75 text-sm leading-relaxed">
          {renderInline(bullet[1])}
        </li>
      );
    }
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      return <p key={i} className="font-semibold text-white text-sm mt-2">{renderInline(h2[1])}</p>;
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-white/75 text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
  });
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#BF5700]/20 border border-[#BF5700]/30 flex items-center justify-center text-[10px] font-bold text-[#BF5700] shrink-0 mt-0.5 mr-2.5">
          AI
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#BF5700]/20 border border-[#BF5700]/30 rounded-tr-sm"
            : "bg-white/[0.06] border border-white/10 rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm text-white/85 leading-relaxed">{msg.content}</p>
        ) : (
          <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-full bg-[#BF5700]/20 border border-[#BF5700]/30 flex items-center justify-center text-[10px] font-bold text-[#BF5700] shrink-0 mt-0.5 mr-2.5">
        AI
      </div>
      <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Context panel ─────────────────────────────────────────────────────────────

function ContextPanel({ sources }: { sources: Source[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(label: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) { next.delete(label); } else { next.add(label); }
      return next;
    });
  }

  const grouped: Record<string, Source[]> = {};
  for (const s of sources) {
    const group =
      s.type === "profile" || s.type === "saved_schools"
        ? "Your Data"
        : s.type === "schools" || s.type === "interview_data"
          ? "Schools"
          : "Admissions Data";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(s);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 border-b border-white/10 shrink-0">
        <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/30">
          Context Panel
        </span>
        <p className="text-xs text-white/20 mt-1">Sources cited in this conversation</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Database size={22} className="text-white/10" />
            <p className="text-xs text-white/20 leading-relaxed max-w-[180px]">
              Sources appear here as the advisor queries your profile and the admissions tables behind the app.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-white/25 mb-2">
                {group}
              </p>
              <div className="space-y-1.5">
                {items.map((s) => {
                  const isOpen = expanded.has(s.label);
                  return (
                    <div
                      key={s.label}
                      className="bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggle(s.label)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                      >
                        <span className="text-[#BF5700] shrink-0">
                          {SOURCE_ICON[s.type] ?? <Database size={11} />}
                        </span>
                        <span className="text-xs text-white/60 flex-1 leading-snug">{s.label}</span>
                        {isOpen
                          ? <ChevronUp   size={11} className="text-white/20 shrink-0" />
                          : <ChevronDown size={11} className="text-white/20 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 border-t border-white/[0.06]">
                          <p className="text-[11px] text-white/35 leading-relaxed">
                            {s.detail}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/10 shrink-0">
        <p className="text-[10px] text-white/15 leading-relaxed">
          Data is pulled live from your saved profile and the Supabase admissions tables used by the app.
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [sources,  setSources]  = useState<Source[]>([]);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const nextId     = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg: Message = { id: nextId.current++, role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: "assistant", content: data.reply },
      ]);

      if (data.sources?.length) {
        setSources((prev) => {
          const combined = [...prev, ...data.sources];
          return combined.filter(
            (s, i, arr) =>
              arr.findIndex((x) => x.label === s.label && x.detail === s.detail) === i,
          );
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [messages, loading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="h-[calc(100vh-3rem)] bg-[#0F172A] flex overflow-hidden">

      {/* ── Conversation pane (65%) ── */}
      <div className="flex-[65] flex flex-col border-r border-white/10 min-w-0">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <h1 className="text-base font-bold text-white">AI Premed Advisor</h1>
          <p className="text-xs text-white/30 mt-0.5">
            Powered by LangChain on Groq · Grounded in Supabase data
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-24">
              <div className="w-12 h-12 rounded-full bg-[#BF5700]/15 border border-[#BF5700]/25 flex items-center justify-center">
                <span className="text-lg font-bold text-[#BF5700]">AI</span>
              </div>
              <div>
                <p className="text-white font-semibold">Ask your premed advisor</p>
                <p className="text-sm text-white/30 mt-1 max-w-xs leading-relaxed">
                  Get data-driven guidance on schools, stats, and strategy using your profile and the app&apos;s admissions data.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
          {loading && <TypingIndicator />}

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-red-400">Request failed</p>
                <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts — only before first message */}
        {isEmpty && (
          <div className="px-6 pb-3 flex flex-wrap gap-2 shrink-0">
            {SUGGESTED.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/45 hover:text-white/75 hover:border-[#BF5700]/30 hover:bg-[#BF5700]/[0.07] transition-colors disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-6 pb-6 pt-3 shrink-0 border-t border-white/[0.06]">
          <div className="flex items-end gap-3 bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#BF5700]/40 transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your chances, ECs, school strategy…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-[#BF5700] hover:bg-[#D4620A] disabled:bg-white/10 disabled:text-white/20 text-white flex items-center justify-center shrink-0 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-white/15 mt-2 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* ── Context panel (35%) ── */}
      <div className="flex-[35] min-w-[220px] max-w-[340px]">
        <ContextPanel sources={sources} />
      </div>

    </div>
  );
}

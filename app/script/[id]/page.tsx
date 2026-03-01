"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Send, Check, X, Zap, Loader2, Save, Copy, CheckCheck, FileCode, Upload } from "lucide-react";
import { ChatCodeBlock } from "@/components/ChatCodeBlock";
import { AppSidebar } from "@/components/AppSidebar";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Message = { role: "user" | "assistant"; content: string; code?: string; isPartial?: boolean; replaceRange?: { startLine: number; endLine: number } };

const EDITOR_MIN_PCT = 28;
const EDITOR_MAX_PCT = 72;

export default function ScriptEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [title, setTitle] = useState("Untitled Script");
  const [content, setContent] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [editorWidth, setEditorWidth] = useState(50);
  const [resizing, setResizing] = useState(false);
  const [pendingIsPartial, setPendingIsPartial] = useState(false);
  const [pendingReplaceRange, setPendingReplaceRange] = useState<{ startLine: number; endLine: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const selectionRangeRef = useRef<{ start: number; end: number } | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const [highlightLines, setHighlightLines] = useState<{ startLine: number; endLine: number } | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [sidebarUser, setSidebarUser] = useState<{ id: string; username: string; credits: number; profileImageUrl?: string | null } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadImageUrl, setUploadImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const loadScript = useCallback(async () => {
    const res = await fetch(`/api/scripts/${id}`);
    if (!res.ok) {
      if (res.status === 401) router.push("/login");
      else if (res.status === 404) router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setTitle(data.title || "Untitled Script");
    setContent(data.content || "");
    if (data.conversationHistory) {
      try {
        const parsed = JSON.parse(data.conversationHistory) as Message[];
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [id, router]);

  const loadUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setCredits(data.user?.credits ?? 0);
      setSidebarUser(data.user ?? null);
    }
  }, []);

  useEffect(() => {
    loadScript();
    loadUser();
  }, [loadScript, loadUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!highlightLines || !editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const { startLine, endLine } = highlightLines;
    const timeout = setTimeout(() => {
      try {
        const model = editor.getModel();
        if (!model) return;
        const lineCount = model.getLineCount();
        const end = Math.min(endLine, lineCount);
        if (startLine > end) return;
        const endColumn = model.getLineMaxColumn(end);
        const range = new monaco.Range(startLine, 1, end, endColumn);
        const newIds = editor.deltaDecorations(decorationIdsRef.current, [
          { range, options: { isWholeLine: true, className: "tuerss-applied-highlight" } },
        ]);
        decorationIdsRef.current = newIds;
        const clearTimeout = window.setTimeout(() => {
          editor.deltaDecorations(decorationIdsRef.current, []);
          decorationIdsRef.current = [];
          setHighlightLines(null);
        }, 3000);
        return () => window.clearTimeout(clearTimeout);
      } catch {
        setHighlightLines(null);
      }
    }, 80);
    return () => clearTimeout(timeout);
  }, [highlightLines]);

  async function saveScript(newContent?: string, newTitle?: string) {
    setSaving(true);
    try {
      const body: { content?: string; title?: string } = {};
      if (newContent !== undefined) body.content = newContent;
      if (newTitle !== undefined) body.title = newTitle;
      await fetch(`/api/scripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (newContent !== undefined) setContent(newContent);
      if (newTitle !== undefined) setTitle(newTitle);
      if (newContent !== undefined) setPendingCode(null);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  function startEditingTitle() {
    setTitleInput(title);
    setEditingTitle(true);
  }

  function submitTitleEdit() {
    const t = titleInput.trim() || "Untitled Script";
    setEditingTitle(false);
    if (t === title) return;
    saveScript(undefined, t);
  }

  async function saveConversation(msgs: Message[]) {
    try {
      await fetch(`/api/scripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: msgs }),
      });
    } catch {
      // ignore
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || (credits !== null && credits < 1)) return;
    setInput("");
    const userMessage: Message = { role: "user", content: text };
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    saveConversation(messagesWithUser);
    setLoading(true);
    selectionRangeRef.current = null;
    let selectedCode = "";
    const editor = editorRef.current;
    if (editor) {
      const model = editor.getModel();
      const sel = editor.getSelection();
      if (model && sel && !sel.isEmpty()) {
        selectedCode = model.getValueInRange(sel);
        const start = model.getOffsetAt(sel.getStartPosition());
        const end = model.getOffsetAt(sel.getEndPosition());
        selectionRangeRef.current = { start, end };
      }
    }
    const MAX_CODE_CONTEXT_LINES = 55;
    const history = messages.map((msg) => {
      let content = msg.content;
      if (msg.code) {
        const lines = msg.code.split("\n");
        const context = lines.length > MAX_CODE_CONTEXT_LINES
          ? lines.slice(0, MAX_CODE_CONTEXT_LINES).join("\n") + "\n..."
          : msg.code;
        content += `\n[Code TuerAi provided (for context—remember variable/function names and structure)]:\n\`\`\`lua\n${context}\n\`\`\``;
      }
      return { role: msg.role, content };
    });
    try {
      const res = await fetch(`/api/scripts/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          ...(selectedCode ? { selectedCode } : {}),
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        const assistantMsg: Message = { role: "assistant", content: "You're out of generations. Come back tomorrow for more free credits, or sign up for a new account." };
        const next = [...messagesWithUser, assistantMsg];
        setMessages(next);
        saveConversation(next);
        setCredits(0);
        return;
      }
      if (!res.ok) {
        const errMsg = data.detail ? `${data.error}: ${data.detail}` : (data.error || "Something went wrong.");
        const assistantMsg: Message = { role: "assistant", content: errMsg };
        const next = [...messagesWithUser, assistantMsg];
        setMessages(next);
        saveConversation(next);
        return;
      }
      setCredits(data.credits ?? credits);
      const isPartial = Boolean(data.isPartial);
      const replaceRange = data.replaceRange ?? null;
      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply || "Here's the code.",
        code: data.code || undefined,
        isPartial,
        replaceRange: replaceRange ?? undefined,
      };
      const next = [...messagesWithUser, assistantMsg];
      setMessages(next);
      saveConversation(next);
      if (data.code) {
        setPendingCode(data.code);
        setPendingIsPartial(isPartial);
        setPendingReplaceRange(replaceRange);
      }
    } catch {
      const assistantMsg: Message = {
        role: "assistant",
        content: "Failed to get a response. Try again.",
      };
      const next = [...messagesWithUser, assistantMsg];
      setMessages(next);
      saveConversation(next);
    } finally {
      setLoading(false);
    }
  }

  function applyPending() {
    if (!pendingCode) return;
    const insertedCode = pendingCode.trimEnd();
    let newContent: string;
    let startLine: number;
    let endLine: number;
    if (pendingReplaceRange) {
      const { startLine: rs, endLine: re } = pendingReplaceRange;
      const lines = content.split("\n");
      const before = lines.slice(0, rs - 1);
      const after = lines.slice(re);
      const replacementLines = insertedCode.split("\n");
      const newLines = [...before, ...replacementLines, ...after];
      newContent = newLines.join("\n");
      startLine = rs;
      endLine = rs + replacementLines.length - 1;
    } else if (pendingIsPartial && selectionRangeRef.current) {
      const { start, end } = selectionRangeRef.current;
      const startClamp = Math.max(0, Math.min(start, content.length));
      const endClamp = Math.max(startClamp, Math.min(end, content.length));
      newContent = content.slice(0, startClamp) + insertedCode + content.slice(endClamp);
      const beforeInsert = newContent.slice(0, startClamp);
      const afterInsertEnd = startClamp + insertedCode.length;
      startLine = beforeInsert.split("\n").length;
      endLine = newContent.slice(0, afterInsertEnd).split("\n").length;
    } else {
      newContent = pendingCode;
      const lines = newContent.split("\n");
      startLine = 1;
      endLine = lines.length;
    }
    setContent(newContent);
    setPendingCode(null);
    setPendingIsPartial(false);
    setPendingReplaceRange(null);
    selectionRangeRef.current = null;
    setHighlightLines({ startLine, endLine });
    saveScript(newContent);
  }

  function declinePending() {
    setPendingCode(null);
    setPendingIsPartial(false);
    setPendingReplaceRange(null);
    selectionRangeRef.current = null;
  }

  useEffect(() => {
    if (!resizing) return;
    const onMouseUp = () => setResizing(false);
    const onMouseMove = (e: MouseEvent) => {
      const container = document.querySelector(".script-editor-layout");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(EDITOR_MIN_PCT, Math.min(EDITOR_MAX_PCT, (x / rect.width) * 100));
      setEditorWidth(pct);
    };
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [resizing]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }

  function openUploadModal() {
    setUploadTitle(title);
    setUploadDescription("");
    setUploadImageUrl(null);
    setUploadError("");
    setUploadModalOpen(true);
  }

  async function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError("");
    if (!uploadTitle.trim()) {
      setUploadError("Title is required");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          description: uploadDescription.trim() || undefined,
          content,
          imageUrl: uploadImageUrl,
          madeByAI: messages.some((m) => m.role === "assistant"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }
      setUploadModalOpen(false);
      router.push("/community");
    } finally {
      setUploading(false);
    }
  }

  let lastAssistantCodeIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant" && messages[i].code) {
      lastAssistantCodeIndex = i;
      break;
    }
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#0d0d0d] text-sand-100">
      <AppSidebar user={sidebarUser} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#141414] px-5 shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sand-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="h-5 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-sand-500 shrink-0" />
            {editingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={submitTitleEdit}
                onKeyDown={(e) => e.key === "Enter" && submitTitleEdit()}
                className="min-w-[120px] rounded border border-white/20 bg-[#0d0d0d] px-2 py-1 font-mono text-sm text-white focus:border-sand-500 focus:outline-none"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={startEditingTitle}
                className="font-mono text-sm font-medium text-white hover:text-sand-200 underline-offset-2 hover:underline"
              >
                {title}
              </button>
            )}
          </div>
          <span className="rounded-md bg-sand-700/50 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-sand-400">
            Lua
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => saveScript(content)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-sand-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {savedAt ? (
              <>
                <CheckCheck className="h-4 w-4 text-green-400" /> Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={openUploadModal}
            className="flex items-center gap-2 rounded-lg border border-sand-500/50 bg-sand-500/10 px-4 py-2 text-sm font-medium text-sand-200 transition hover:bg-sand-500/20 hover:text-white"
          >
            <Upload className="h-4 w-4" /> Upload to community
          </button>
          {credits !== null && (
            <div className="flex items-center gap-2 rounded-full border border-sand-600/50 bg-sand-800/30 px-4 py-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-sand-200">{credits}</span>
              <span className="text-xs text-sand-500">generations</span>
            </div>
          )}
        </div>
      </header>

      <div
        className="script-editor-layout flex min-h-0 flex-1 overflow-hidden"
        onMouseLeave={() => resizing && setResizing(false)}
      >
        <div
          className="flex min-h-0 shrink-0 flex-col border-r border-white/10 bg-[#0d0d0d] transition-[width] duration-100"
          style={{ width: `${editorWidth}%` }}
        >
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 bg-[#141414] px-4">
            <span className="text-xs text-sand-500">Script</span>
            <span className="font-mono text-[11px] text-sand-600">Monaco · Lua</span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language="lua"
              theme="tuerss-dark"
              value={content}
              onChange={(v) => setContent(v ?? "")}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              beforeMount={(monaco) => {
                monacoRef.current = monaco;
                monaco.editor.defineTheme("tuerss-dark", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [
                    { token: "comment", foreground: "6a9955" },
                    { token: "keyword", foreground: "c586c0" },
                    { token: "string", foreground: "ce9178" },
                    { token: "number", foreground: "b5cea8" },
                    { token: "function", foreground: "dcdcaa" },
                  ],
                  colors: {
                    "editor.background": "#0d0d0d",
                    "editor.foreground": "#d4d4d4",
                    "editorLineNumber.foreground": "#5a5a5a",
                    "editorLineNumber.activeForeground": "#c6c6c6",
                    "editor.selectionBackground": "#264f78",
                    "editor.lineHighlightBackground": "#1a1a1a",
                    "editorCursor.foreground": "#aeafad",
                  },
                });
              }}
              options={{
                minimap: { enabled: true, scale: 0.8, showSlider: "mouseover" },
                fontSize: 14,
                lineNumbers: "on",
                lineNumbersMinChars: 3,
                padding: { top: 16, bottom: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', var(--font-mono), monospace",
                fontLigatures: true,
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                tabSize: 4,
                insertSpaces: true,
                bracketPairColorization: { enabled: true },
                guides: { indentation: true, bracketPairs: true },
                folding: true,
                foldingStrategy: "indentation",
                renderLineHighlight: "all",
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                mouseWheelZoom: true,
                scrollbar: {
                  vertical: "hidden",
                  horizontal: "hidden",
                  useShadows: false,
                  verticalScrollbarSize: 0,
                  horizontalScrollbarSize: 0,
                },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                stickyScroll: { enabled: true },
              }}
              loading={
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#0d0d0d] text-sand-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand-600 border-t-sand-400" />
                  <span className="text-sm">Loading editor…</span>
                </div>
              }
            />
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          className="flex w-2 shrink-0 cursor-col-resize items-center justify-center border-x border-white/10 bg-[#0d0d0d] transition hover:bg-white/5"
          onMouseDown={() => setResizing(true)}
          onKeyDown={() => {}}
        >
          <div className="h-12 w-1 rounded-full bg-white/20 transition hover:bg-sand-500/60" />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#111]">
          <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-[#141414] px-5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-white">TuerAi</span>
            </div>
            <span className="text-xs text-sand-500">Latest development AI for Roblox</span>
          </div>
          <div className="tuerss-chat-scroll tuerss-scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden p-5">
            <div className="mx-auto max-w-2xl space-y-6">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-500/20">
                    <FileCode className="h-7 w-7 text-sand-400" />
                  </div>
                  <p className="text-lg font-medium text-sand-200">New chat</p>
                  <p className="mt-2 text-sm leading-relaxed text-sand-500">
                    Describe the script you want. Try: &quot;Create an admin script that kicks players when they say bad words&quot; or &quot;Make a part turn red when touched.&quot;
                  </p>
                </div>
              )}
              {messages.map((msg, i) => {
                const showApplyDecline =
                  Boolean(pendingCode && !saving && msg.code && i === lastAssistantCodeIndex);
                return (
                  <div key={i} className="flex flex-col gap-2">
                    <div
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${
                          msg.role === "user"
                            ? "bg-sand-500/90 text-white"
                            : "bg-[#1e1e1e] text-sand-200 border border-white/10"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sand-500">
                            TuerAi
                          </p>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                    {msg.code && (
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-xl max-h-[70vh] flex flex-col">
                        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#141414] px-4 py-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-sand-500">
                            Lua
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCode(msg.code!)}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-sand-400 transition hover:bg-white/10 hover:text-sand-200"
                          >
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto">
                          <ChatCodeBlock code={msg.code} />
                        </div>
                        {showApplyDecline && (
                          <div className="flex items-center gap-2 border-t border-white/10 bg-[#141414] px-4 py-3">
                            <button
                              onClick={applyPending}
                              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-emerald-500"
                            >
                              <Check className="h-4 w-4" /> Apply to editor
                            </button>
                            <button
                              onClick={declinePending}
                              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-sand-300 transition hover:bg-white/10"
                            >
                              <X className="h-4 w-4" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1e1e1e] px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-sand-500 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-sand-500 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-sand-500 [animation-delay:300ms]" />
                  </div>
                  <span className="text-sm text-sand-400">TuerAi is thinking…</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
          <div className="shrink-0 border-t border-white/10 bg-[#141414] p-4">
            <div className="mx-auto flex max-w-2xl gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Describe what you want… (e.g. make a block that explodes when clicked)"
                rows={1}
                className="min-h-[48px] w-full resize-none rounded-xl border border-white/20 bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-sand-500 focus:border-sand-500 focus:outline-none focus:ring-2 focus:ring-sand-500/30"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || (credits !== null && credits < 1)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sand-500 text-white shadow-lg transition hover:bg-sand-400 disabled:opacity-50 disabled:hover:bg-sand-500"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-sand-600">
              1 generation per request · TuerAi remembers this conversation · Select code to edit only that part
            </p>
          </div>
        </div>
      </div>
      </div>

      {/* Upload to community modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !uploading && setUploadModalOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Upload to community</h3>
            <p className="mt-1 text-sm text-sand-500">Share this script on the community feed. Others can view and comment.</p>
            <form onSubmit={submitUpload} className="mt-4 space-y-4">
              {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}
              <div>
                <label className="block text-sm font-medium text-sand-400">Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Script title"
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-3 py-2 text-white placeholder:text-sand-600 focus:border-sand-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sand-400">Description (optional)</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="What does this script do?"
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-3 py-2 text-sm text-white placeholder:text-sand-600 focus:border-sand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sand-400">Image (optional)</label>
                <p className="mt-0.5 text-xs text-sand-500">Preview image for the community post. If you don&apos;t add one, it will show &quot;No image available&quot;.</p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="upload-community-image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        const reader = new FileReader();
                        reader.onload = () => setUploadImageUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                      e.target.value = "";
                    }}
                  />
                  <label htmlFor="upload-community-image" className="cursor-pointer rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-sand-300 hover:bg-white/10">
                    Choose image
                  </label>
                  {uploadImageUrl && (
                    <div className="relative">
                      <img src={uploadImageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      <button type="button" onClick={() => setUploadImageUrl(null)} className="absolute -right-1 -top-1 rounded-full bg-red-600 p-0.5 text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {messages.some((m) => m.role === "assistant") && (
                <p className="text-xs text-sand-500">This will be labeled &quot;Script made by AI&quot; since you used TuerAi.</p>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => !uploading && setUploadModalOpen(false)} className="flex-1 rounded-lg border border-white/20 py-2 text-sm text-sand-400 hover:bg-white/10">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="flex-1 rounded-lg bg-sand-500 py-2 text-sm font-medium text-white hover:bg-sand-400 disabled:opacity-50">
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

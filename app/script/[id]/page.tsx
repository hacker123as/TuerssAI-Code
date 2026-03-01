"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Send, Check, X, Zap, Loader2, Save } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Message = { role: "user" | "assistant"; content: string; code?: string };

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
  }, [id, router]);

  const loadUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setCredits(data.user?.credits ?? 0);
    }
  }, []);

  useEffect(() => {
    loadScript();
    loadUser();
  }, [loadScript, loadUser]);

  async function saveScript(newContent: string, newTitle?: string) {
    setSaving(true);
    try {
      await fetch(`/api/scripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent, ...(newTitle && { title: newTitle }) }),
      });
      setContent(newContent);
      if (newTitle) setTitle(newTitle);
      setPendingCode(null);
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || (credits !== null && credits < 1)) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content + (msg.code ? `\n[Code provided: ${msg.code.slice(0, 80)}...]` : ""),
      }));
      const res = await fetch(`/api/scripts/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "You're out of generations. Come back tomorrow for more free credits, or sign up for a new account." },
        ]);
        setCredits(0);
        return;
      }
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: data.error || "Something went wrong." }]);
        return;
      }
      setCredits(data.credits ?? credits);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "Here's the code.", code: data.code || undefined },
      ]);
      if (data.code) setPendingCode(data.code);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Failed to get a response. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function applyPending() {
    if (pendingCode) saveScript(pendingCode);
  }

  function declinePending() {
    setPendingCode(null);
  }

  return (
    <div className="flex h-screen flex-col bg-sand-100">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-sand-300 bg-sand-50 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sand-600 hover:bg-sand-200"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <span className="font-mono text-sm font-medium text-sand-800">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => saveScript(content)}
            disabled={saving}
            className="flex items-center gap-1 rounded-lg border border-sand-300 bg-sand-50 px-2.5 py-1.5 text-sm text-sand-700 hover:bg-sand-100 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </button>
          {credits !== null && (
            <span className="flex items-center gap-1 rounded-full bg-sand-200 px-2.5 py-1 text-sm text-sand-700">
              <Zap className="h-3.5 w-3.5" /> {credits} generations
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="w-1/2 flex flex-col border-r border-sand-300 bg-sand-50/50">
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language="lua"
              theme="vs-light"
              value={content}
              onChange={(v) => setContent(v ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 12 },
                fontFamily: "var(--font-mono), monospace",
              }}
              loading={<div className="flex h-full items-center justify-center text-sand-500">Loading editor…</div>}
            />
          </div>
        </div>

        <div className="w-1/2 flex flex-col bg-white border-l border-sand-200">
          <div className="border-b border-sand-200 bg-sand-50 px-4 py-2">
            <span className="font-semibold text-sand-800">TuerAi</span>
            <span className="ml-2 text-sm text-sand-500">Latest development AI for Roblox</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-sand-300 bg-sand-50/50 p-6 text-center text-sand-600">
                <p className="font-medium">New chat</p>
                <p className="mt-1 text-sm">Describe the script you want. Example: &quot;Create an admin script that kicks players when they say bad words.&quot;</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg px-4 py-2 ${
                  msg.role === "user" ? "ml-8 bg-sand-200/80 text-sand-900" : "mr-8 bg-sand-100 text-sand-800"
                }`}
              >
                {msg.role === "assistant" && (
                  <p className="text-xs font-medium text-sand-500 mb-1">TuerAi</p>
                )}
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                {msg.code && (
                  <pre className="mt-2 overflow-x-auto rounded bg-sand-900 p-3 text-xs text-sand-100">
                    {msg.code}
                  </pre>
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-8 flex items-center gap-2 rounded-lg bg-sand-100 px-4 py-2 text-sand-600">
                <Loader2 className="h-4 w-4 animate-spin" /> TuerAi is thinking…
              </div>
            )}
            {pendingCode && !saving && (
              <div className="flex items-center gap-2 rounded-lg border border-sand-300 bg-amber-50 p-3">
                <button
                  onClick={applyPending}
                  className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Check className="h-4 w-4" /> Apply changes
                </button>
                <button
                  onClick={declinePending}
                  className="flex items-center gap-1 rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-sm hover:bg-sand-100"
                >
                  <X className="h-4 w-4" /> Decline
                </button>
              </div>
            )}
          </div>
          <div className="border-t border-sand-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Describe what you want..."
                className="flex-1 rounded-lg border border-sand-300 bg-white px-4 py-2.5 text-sand-900 placeholder:text-sand-400 focus:border-sand-500 focus:outline-none focus:ring-1 focus:ring-sand-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || (credits !== null && credits < 1)}
                className="rounded-lg bg-sand-500 px-4 py-2.5 text-white hover:bg-sand-600 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-sand-500">1 generation per request. TuerAi remembers this conversation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

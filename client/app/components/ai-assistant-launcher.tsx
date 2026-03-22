"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";
import MovieResultCard from "@/app/components/cards/movie-result-card";
import { AssistantMessage } from "@/app/modal/service.modal";
import { chatWithAssistant } from "@/app/services/movie.service";

const STORAGE_KEY = "movie_ai_assistant_session";

export default function AiAssistantLauncher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content:
        "Tell me a movie, genre, actor, mood, or story type. I can describe it and recommend up to 3 similar movies.",
    },
  ]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AssistantMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) {
      return;
    }

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");

    try {
      setLoading(true);
      const result = await chatWithAssistant(
        nextMessages.map(({ role, content: text }) => ({ role, content: text })),
      );

      setMessages([
        ...nextMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.reply,
          suggestions: result.suggestions,
        },
      ]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "I could not answer right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openMovie = (imdbId: string) => {
    if (!imdbId) return;
    setOpen(false);
    router.push(`/content/${imdbId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-[100] inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/55 px-3 py-3 text-left text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/8 backdrop-blur-xl transition hover:border-cyan-300/35 hover:bg-black/70 hover:shadow-[0_24px_60px_rgba(8,145,178,0.2)] sm:right-6 sm:bottom-6 sm:gap-3"
        aria-label="Open AI assistant"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/25 bg-[linear-gradient(145deg,rgba(34,211,238,0.22),rgba(15,23,42,0.96))] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_rgba(6,182,212,0.18)] sm:h-11 sm:w-11">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="hidden flex-col leading-tight min-[420px]:flex">
          <span className="text-[10px] font-medium tracking-[0.24em] text-cyan-200/70 uppercase">
            Cine guide
          </span>
          <span className="text-sm font-semibold text-white">Ask AI</span>
        </span>
      </button>

      <DialogContent
        showCloseButton={false}
        className="flex h-[100dvh] w-[100vw] max-w-none flex-col overflow-hidden rounded-none border-0 bg-white p-0 text-slate-900 shadow-2xl sm:h-[min(88vh,760px)] sm:w-[min(96vw,64rem)] sm:max-w-4xl sm:rounded-3xl sm:border sm:border-slate-200"
      >
        <DialogHeader className="shrink-0 border-b border-slate-200 px-4 py-4 pr-14 text-left sm:px-6 sm:py-5 sm:pr-16">
          <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">AI Assistant</p>
          <DialogTitle className="mt-1 text-xl font-semibold sm:text-2xl">Movie chat assistant</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-slate-600">
            Ask about a movie and get a description plus up to three suggestions.
          </DialogDescription>
        </DialogHeader>

        <DialogClose className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 sm:top-4 sm:right-4">
          <X className="h-4 w-4" />
          <span className="sr-only">Close assistant</span>
        </DialogClose>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 sm:px-6 sm:py-5">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <div
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[92%] rounded-2xl bg-slate-950 px-4 py-3 text-sm leading-6 text-white sm:max-w-[85%]"
                      : "max-w-[96%] rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm sm:max-w-[90%]"
                  }
                >
                  {message.content}
                </div>

                {message.suggestions?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {message.suggestions.map((movie) => (
                      <MovieResultCard
                        key={`${message.id}-${movie.imdbId}`}
                        imdbId={movie.imdbId}
                        title={movie.title}
                        releaseYear={movie.year}
                        posterUrl={movie.poster}
                        titleType={movie.type}
                        tone="light"
                        className="hover:bg-slate-100"
                        onClick={() => openMovie(movie.imdbId)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking about movies...
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          className="shrink-0 border-t border-slate-200 bg-white px-3 py-3 sm:px-6 sm:py-5"
          onSubmit={onSubmit}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask about a movie, genre, actor, or mood..."
            rows={2}
            className="min-h-[52px] resize-none border-slate-300 bg-white text-sm leading-6 sm:min-h-[56px]"
          />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800 sm:h-12 sm:w-auto sm:min-w-28"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Press Enter to send, Shift+Enter for a new line.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

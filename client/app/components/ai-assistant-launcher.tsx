"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Send, Sparkles, UserCircle2, X } from "lucide-react";
import RenderAvatar from "@/app/components/avatar/render-avatar";
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
import AuthRequiredModal from "@/app/modal/auth-required-modal";
import { AssistantMessage } from "@/app/modal/service.modal";
import { chatWithAssistant } from "@/app/services/movie.service";
import {
  clearAuthState,
  fetchCurrentUser,
  getAuthStoreState,
  useAuthStore,
} from "@/app/store/auth-store";
import { brand } from "@/app/config/brand";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "movie_ai_assistant_session";

export default function AiAssistantLauncher() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((auth) => auth.user);
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
    if (!stored) return;

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

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, open]);

  const promptLogin = () => {
    setOpen(false);
    setAuthModalOpen(true);
  };

  const ensureAuthenticated = async () => {
    if (getAuthStoreState().user?.id) {
      return true;
    }

    const sessionUser = await fetchCurrentUser();
    if (!sessionUser?.id) {
      promptLogin();
      return false;
    }

    return true;
  };

  const openAssistant = async () => {
    if (!(await ensureAuthenticated())) {
      return;
    }

    setOpen(true);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!(await ensureAuthenticated())) return;
    const content = input.trim();
    if (!content || loading) return;
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
        nextMessages.map(({ role, content: text }) => ({
          role,
          content: text,
        })),
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
      if (error instanceof Error && /unauthorized|invalid token|user not found/i.test(error.message)) {
        clearAuthState();
        promptLogin();
        return;
      }

      setMessages([
        ...nextMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            error instanceof Error ? error.message : "Assistant request failed",
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

  const currentUserName = user?.name?.trim() || user?.username?.trim() || "You";

  const AiAvatar = ({ className }: { className?: string }) => (
    <span className="text-brand-primary inline-flex items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--brand-primary)_20%,transparent)] bg-[linear-gradient(145deg,color-mix(in_oklab,var(--brand-primary)_14%,transparent),rgba(11,16,24,0.98))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_rgba(15,23,42,0.28)]">
      <Sparkles className={cn("md:h-5 h-4 w-4 md:w-5", className)} />
    </span>
  );

  const renderUserAvatar = () => {
    if (!user) {
      return (
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.2)]">
          <UserCircle2 className="h-5 w-5" />
        </span>
      );
    }

    return (
      <RenderAvatar
        name={currentUserName}
        className="h-10 w-10 border border-white/10 bg-white/8 shadow-[0_10px_24px_rgba(15,23,42,0.2)] md:h-10 md:w-10"
        initialsClassName="text-xs font-semibold text-white"
      />
    );
  };

  const renderMessage = (message: AssistantMessage) => {
    const isUser = message.role === "user";
    return (
      <div
        key={message.id}
        className={cn(
          "min-w-0 space-y-3",
          isUser ? "ml-auto max-w-[96%] sm:max-w-[90%]" : "max-w-[96%]",
        )}
      >
        <div
          className={cn(
            "flex items-start gap-3",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          {!isUser ? <AiAvatar className="md:h-4 h-3 w-3 md:w-4" /> : null}

          <div
            className={cn(
              "min-w-0",
              isUser
                ? "max-w-[92%] sm:max-w-[85%]"
                : "max-w-[92%] sm:max-w-[88%]",
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)]",
                isUser
                  ? "bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(236,242,248,0.94))] text-slate-900"
                  : "border border-white/10 bg-[linear-gradient(180deg,rgba(15,22,34,0.96),rgba(9,14,24,0.98))] text-white/88",
              )}
            >
              <p className="text-xs sm:text-sm md:text-base">{message.content}</p>
            </div>
          </div>

          {isUser ? renderUserAvatar() : null}
        </div>

        {message.suggestions?.length ? (
          <div
            className={cn(
              "min-w-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
              !isUser ? "sm:pl-13" : "",
            )}
          >
            {message.suggestions.map((movie) => (
              <MovieResultCard
                key={`${message.id}-${movie.imdbId}`}
                imdbId={movie.imdbId}
                title={movie.title}
                releaseYear={movie.year}
                posterUrl={movie.poster}
                titleType={movie.type}
                className="border-white/8 bg-[#10161f] text-white hover:bg-[#17202c]"
                onClick={() => openMovie(movie.imdbId)}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => {
            void openAssistant();
          }}
          className="fixed right-4 bottom-4 z-100 inline-flex items-center rounded-full border border-white/12 bg-[#0b1018]/90 p-1 text-left text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/8 backdrop-blur-xl transition hover:border-brand-primary-soft hover:bg-[#111722] sm:right-6 sm:bottom-6 sm:gap-3"
          aria-label="Open AI assistant"
        >
          <AiAvatar />
          <span className="hidden flex-col leading-tight min-[420px]:flex">
            <span className="text-brand-primary-muted text-[10px] font-medium tracking-[0.24em] uppercase">
              {brand.assistantEyebrow}
            </span>
            <span className="text-sm font-semibold text-white">{brand.assistantTitle}</span>
          </span>
        </button>

        <DialogContent
          showCloseButton={false}
          contentWrapperClassName="items-end justify-stretch p-0 sm:items-center sm:justify-center sm:p-4"
          className="data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:slide-in-from-bottom-8 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 flex h-dvh w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-black/92 p-0 text-white shadow-2xl sm:h-[min(88vh,760px)] sm:w-[min(96vw,64rem)] sm:max-w-4xl sm:rounded-3xl sm:border sm:border-white/10 sm:bg-black/85"
        >
        <DialogHeader className="shrink-0 border-b border-white/10 px-4 py-4 pr-14 text-left sm:px-6 sm:py-5 sm:pr-16 -space-y-2">
          <p className="text-brand-primary text-[10px] md:text-xs font-semibold tracking-[0.22em] uppercase">
            {brand.assistantEyebrow}
          </p>
          <DialogTitle className="mt-1 text-base md:text-xl font-semibold sm:text-2xl">
            {brand.assistantTitle}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs md:text-sm text-white/55">
            {brand.assistantDescription}
          </DialogDescription>
        </DialogHeader>

        <DialogClose className="focus-visible:ring-brand-primary-soft absolute top-3 right-3 inline-flex  p-1 md:p-2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 sm:top-4 sm:right-4">
          <X className="h-4 w-4 md:h-5 md:w-5" />
          <span className="sr-only">Close assistant</span>
        </DialogClose>

        <div className="home-search-scroll flex-1 overflow-x-hidden overflow-y-auto bg-white/3 px-3 py-3 sm:px-6 sm:py-5">
          <div className="min-w-0 space-y-4">
            {messages.map(renderMessage)}

            {loading && (
              <div className="flex items-start gap-3">
                <AiAvatar className="h-4 w-4" />
                <div className="max-w-[92%] sm:max-w-[88%]">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,22,34,0.96),rgba(9,14,24,0.98))] px-4 py-3 text-sm text-white/70 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking about movies...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          className="shrink-0 border-t border-white/10 bg-[#0b1018]/85 px-3 py-3 sm:px-6 sm:py-5"
          onSubmit={onSubmit}
        >
          <div className="flex items-end gap-2 sm:gap-3">
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
              className="min-h-11 flex-1 resize-none border-white/12 bg-[#10161f] text-sm leading-6 text-white placeholder:text-white/35"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 w-11 shrink-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(236,242,248,0.94))] px-0 text-slate-950 hover:bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(236,242,248,0.94))]/60 cursor-pointer sm:w-auto sm:min-w-28 sm:px-4"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <p className="mt-2 text-xs text-white/45">
            Press Enter to send, Shift+Enter for a new line.
          </p>
        </form>
        </DialogContent>
      </Dialog>
      <AuthRequiredModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        nextPath={pathname || "/"}
        title="Login to use AI Assistant"
        description="Sign in or create an account to chat with the movie assistant and keep your recommendations tied to your session."
      />
    </>
  );
}

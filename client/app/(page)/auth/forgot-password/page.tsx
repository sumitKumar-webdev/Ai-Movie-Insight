"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "@/app/Hooks/use-toast";
import { AuthShell } from "@/app/components/auth/auth-shell";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { buildApiUrl } from "@/app/services/api-client";

export default function ForgotPasswordPage() {
  const [safeNext, setSafeNext] = useState("/home");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    setSafeNext(next?.startsWith("/") ? next : "/home");
    setToken(params.get("token")?.trim() ?? "");
  }, []);

  const isResetMode = Boolean(token);

  const onForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setResetUrl("");

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        data?: { resetUrl?: string };
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to send reset link");
        return;
      }

      setNotice(
        payload.message ?? "If that email is registered, a reset link has been sent.",
      );
      setResetUrl(payload.data?.resetUrl ?? "");
    } catch {
      setError("Unable to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to reset password");
        return;
      }

      setNotice(payload.message ?? "Password reset successfully.");
      toast({
        title: "Password updated",
        description: "Your password was changed successfully.",
        variant: "success",
      });
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge={isResetMode ? "Create new password" : "Password help"}
      title={isResetMode ? "Reset password" : "Forgot password"}
      description={
        isResetMode
          ? "Choose a new password for your account and get back to browsing."
          : "Enter your email and we&apos;ll send you a password reset link so you can get back to browsing."
      }
      footer={
        <>
          {isResetMode ? "Remembered it again? " : "Remembered your password? "}
          <Link
            href={`/auth/login?next=${encodeURIComponent(safeNext)}`}
            className="font-medium text-slate-950 transition hover:text-cyan-700"
          >
            Back to login
          </Link>
        </>
      }
    >
        <form
          className="mt-6 space-y-4"
          onSubmit={isResetMode ? onResetSubmit : onForgotSubmit}
        >
        {isResetMode ? (
          <>
            <div className="space-y-2">
              <label
                htmlFor="reset-password"
                className="text-sm font-medium text-slate-700"
              >
                New password
              </label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-11 border-slate-300 bg-white pr-11 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="reset-password-confirm"
                className="text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>
              <div className="relative">
                <Input
                  id="reset-password-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your new password"
                  className="h-11 border-slate-300 bg-white pr-11 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-800"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label
              htmlFor="forgot-email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>
        )}

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <p>{notice}</p>
            {isResetMode ? (
              <Link
                href={`/auth/login?next=${encodeURIComponent(safeNext)}`}
                className="mt-2 inline-block font-medium underline"
              >
                Go to login
              </Link>
            ) : resetUrl ? (
              <a href={resetUrl} className="mt-2 inline-block font-medium underline">
                Open reset link
              </a>
            ) : null}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={
            loading ||
            (isResetMode
              ? !token || !password || !confirmPassword
              : !email.trim())
          }
          className="h-12 w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {isResetMode ? "Resetting..." : "Sending..."}
            </div>
          ) : isResetMode ? (
            "Reset password"
          ) : (
            "Send reset link"
          )}
        </Button>
        </form>

        {!isResetMode && !notice ? (
          <p className="mt-4 text-sm text-slate-500">
            We&apos;ll send a secure link to your inbox if the account exists.
          </p>
        ) : null}

        {isResetMode && !token ? (
          <p className="mt-5 text-sm text-slate-600">
            Need a fresh link?{" "}
            <Link
              href="/auth/forgot-password"
              className="font-medium text-slate-950 transition hover:text-cyan-700"
            >
              Request another reset email
            </Link>
          </p>
        ) : null}
    </AuthShell>
  );
}

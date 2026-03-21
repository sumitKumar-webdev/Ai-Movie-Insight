"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleAuthButton } from "@/app/components/auth/google-auth-button";
import { AuthShell } from "@/app/components/auth/auth-shell";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { buildApiUrl } from "@/app/services/api-client";
import { AuthUser, setAuthenticatedUser } from "@/app/store/auth-store";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long.")
    .max(20, "Username must be 20 characters or less.")
    .regex(
      USERNAME_PATTERN,
      "Use lowercase letters, numbers, or underscores only.",
    ),
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

type SignupFormValues = z.infer<typeof signupSchema>;
type UsernameStatus = "idle" | "invalid" | "checking" | "available" | "taken";

export default function SignupPage() {
  const router = useRouter();
  const [safeNext, setSafeNext] = useState("/");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const usernameValue = watch("username");
  const normalizedUsername = useMemo(
    () => usernameValue.trim().toLowerCase(),
    [usernameValue],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    setSafeNext(next?.startsWith("/") ? next : "/");
  }, []);

  useEffect(() => {
    setError("");

    if (!normalizedUsername) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setUsernameStatus("invalid");
      setUsernameMessage(
        "Use 3-20 lowercase letters, numbers, or underscores.",
      );
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("Checking username...");

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          buildApiUrl(
            `/api/auth/check-username?username=${encodeURIComponent(normalizedUsername)}`,
          ),
          {
            method: "GET",
            credentials: "include",
          },
        );
        const payload = (await response.json()) as {
          error?: string;
          data?: {
            available?: boolean;
            reason?: string;
          };
        };

        if (!response.ok) {
          setUsernameStatus("invalid");
          setUsernameMessage(payload.error ?? "Unable to check username right now.");
          return;
        }

        if (payload.data?.available) {
          setUsernameStatus("available");
          setUsernameMessage("Username is available.");
          return;
        }

        setUsernameStatus("taken");
        setUsernameMessage(payload.data?.reason ?? "Username already exists.");
      } catch {
        setUsernameStatus("invalid");
        setUsernameMessage("Unable to check username right now.");
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [normalizedUsername]);

  const onSubmit = async ({
    name,
    username,
    email,
    password,
  }: SignupFormValues) => {
    setError("");
    setNotice("");
    setVerificationUrl("");

    const normalized = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized)) {
      setError("Please choose a valid username.");
      return;
    }

    if (usernameStatus === "checking") {
      setError("Username availability is still being checked.");
      return;
    }

    if (usernameStatus !== "available") {
      setError("Please choose a different username.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          username: normalized,
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        data?: {
          user?: AuthUser;
          requiresVerification?: boolean;
          verificationUrl?: string;
        };
      };

      if (!response.ok) {
        setError(payload.error ?? "Signup failed");
        return;
      }

      if (payload.data?.user && !payload.data?.requiresVerification) {
        setAuthenticatedUser(payload.data.user);
        router.replace(safeNext);
        router.refresh();
        return;
      }

      if (payload.data?.requiresVerification) {
        setVerificationUrl(payload.data.verificationUrl ?? "");
        setNotice(payload.message ?? "Check your email to verify your account.");
        return;
      }

      setError("Signup failed");
    } catch {
      setError("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Join the club"
      title="Sign up"
      description="Create your account to save favorites, track discoveries, and unlock AI movie insights."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/auth/login?next=${encodeURIComponent(safeNext)}`}
            className="font-medium text-slate-950 transition hover:text-cyan-700"
          >
            Login
          </Link>
        </>
      }
    >
      <form
        className="mt-5i space-y-2"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Name
            </label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              className="h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
              aria-invalid={errors.name ? "true" : "false"}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-rose-600">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-username" className="text-sm font-medium text-slate-700">
              Username
            </label>
            <div className="relative">
              <Input
                id="signup-username"
                type="text"
                autoComplete="username"
                placeholder="moviefan"
                className={`h-11 border-slate-300 bg-white pr-11 text-slate-900 placeholder:text-slate-400 ${
                  usernameStatus === "available"
                    ? "border-emerald-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-200"
                    : ""
                }`}
                aria-invalid={errors.username ? "true" : "false"}
                {...register("username")}
              />
              {usernameStatus === "checking" ? (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              ) : null}
              {usernameStatus === "available" ? (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              ) : null}
            </div>
            {errors.username ? (
              <p className="text-sm text-rose-600">{errors.username.message}</p>
            ) : usernameMessage ? (
              <p
                className={`text-sm ${
                  usernameStatus === "available"
                    ? "text-emerald-600"
                    : usernameStatus === "checking"
                      ? "text-slate-500"
                      : "text-rose-600"
                }`}
              >
                {usernameMessage}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-rose-600">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                className="h-11 border-slate-300 bg-white pr-11 text-slate-900 placeholder:text-slate-400"
                aria-invalid={errors.password ? "true" : "false"}
                {...register("password")}
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
            {errors.password ? (
              <p className="text-sm text-rose-600">{errors.password.message}</p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          {notice ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <p>{notice}</p>
              {verificationUrl ? (
                <a href={verificationUrl} className="mt-2 inline-block font-medium underline">
                  Open verification link
                </a>
              ) : null}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={loading || usernameStatus === "checking"}
            className="h-12 w-full"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating account...
              </div>
            ) : (
              "Sign up"
            )}
          </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs uppercase tracking-wide text-slate-500">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleAuthButton mode="signup" nextPath={safeNext} onError={setError} />
    </AuthShell>
  );
}

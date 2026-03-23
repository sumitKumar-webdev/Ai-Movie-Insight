"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleAuthButton } from "@/app/components/auth/google-auth-button";
import { AuthShell } from "@/app/components/auth/auth-shell";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { toast } from "@/app/Hooks/use-toast";
import { setAuthenticatedUser } from "@/app/store/auth-store";
import { login, resendVerificationEmail } from "@/app/services/auth.service";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { brand } from "@/app/config/brand";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or username is required."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [safeNext, setSafeNext] = useState("/");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    setSafeNext(next?.startsWith("/") ? next : "/");
  }, []);

  const onSubmit = async ({ identifier, password }: LoginFormValues) => {
    setError("");
    setNotice("");
    try {
      setLoading(true);
      const response = await login({ identifier, password });
      if (!response.status || !response?.data?.user) {
        if (response.message === "Please verify your email before logging in") {
          const normalizedIdentifier = identifier.trim();
          if (normalizedIdentifier.includes("@")) {
            setResendEmail(normalizedIdentifier.toLowerCase());
          }
        }
        setError(response.message ?? "Login failed");
        return;
      }

      setAuthenticatedUser(response.data.user);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${response.data.user.name}.`,
        variant: "success",
      });
      router.replace(safeNext);
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onResendVerification = async () => {
    setError("");
    setNotice("");

    const email = resendEmail.trim().toLowerCase();
    if (!email) {
      setError("Enter your email to resend the verification link.");
      return;
    }

    try {
      setResendLoading(true);
      const response = await resendVerificationEmail(email);

      if (!response.status) {
        setError(response.message ?? "Unable to resend verification email.");
        return;
      }

      setNotice(response.message ?? "A new verification email has been sent.");
    } catch {
      setError("Unable to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  const fields: Array<{
    name: keyof LoginFormValues;
    label: string;
    id: string;
    autoComplete: string;
    placeholder: string;
    type: "text" | "password";
    hasVisibilityToggle?: boolean;
  }> = [
    {
      name: "identifier",
      label: "Email or username",
      id: "identifier",
      autoComplete: "username",
      placeholder: "you@example.com or moviefan",
      type: "text",
    },
    {
      name: "password",
      label: "Password",
      id: "password",
      autoComplete: "current-password",
      placeholder: "Enter your password",
      type: "password",
      hasVisibilityToggle: true,
    },
  ];

  return (
    <AuthShell
      badge="Welcome back"
      title="Login"
      description={`Sign in to continue exploring reviews, saved picks, and ${brand.authInsightLabel}.`}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href={`/auth/signup?next=${encodeURIComponent(safeNext)}`}
            className="font-medium text-slate-950 transition hover:text-cyan-700"
          >
            Sign up
          </Link>
        </>
      }
    >
      {error ? (
        <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <form
        className="mt-5 space-y-2"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {fields.map((field) => {
          const fieldError = errors[field.name];
          const isPasswordField = field.hasVisibilityToggle;

          return (
            <div key={field.name} className="space-y-2">
              <label
                htmlFor={field.id}
                className="pb-2 text-sm font-medium text-slate-700"
              >
                {field.label}
              </label>

              <div className="relative">
                <Input
                  id={field.id}
                  type={isPasswordField && showPassword ? "text" : field.type}
                  autoComplete={field.autoComplete}
                  required
                  placeholder={field.placeholder}
                  className={`h-12 rounded-xl ${isPasswordField ? "pr-12" : ""}`}
                  aria-invalid={fieldError ? "true" : "false"}
                  {...register(field.name)}
                />

                {isPasswordField ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-slate-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </div>

              {fieldError && (
                <p className="text-sm text-rose-600">{fieldError.message}</p>
              )}
            </div>
          );
        })}

        <div className="-mt-3 text-right">
          <Link
            href={`/auth/forgot-password?next=${encodeURIComponent(safeNext)}`}
            className="text-sm font-medium text-slate-600 transition hover:text-cyan-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="mb-5 h-12 w-full" disabled={loading}>
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Logging in...
            </div>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      {error === "Please verify your email before logging in" ? (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Need a new verification email?</p>
          <p className="mt-1 text-sm text-slate-600">
            Enter the email for your account and we&apos;ll send a fresh verification link.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              value={resendEmail}
              onChange={(event) => setResendEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-11"
            />
            <Button
              type="button"
              variant="outline"
              onClick={onResendVerification}
              disabled={resendLoading}
              className="h-11 sm:min-w-44"
            >
              {resendLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                "Resend email"
              )}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-3 text-center text-xs uppercase tracking-[0.24em] text-slate-400">
        or
      </div>

      <GoogleAuthButton mode="login" nextPath={safeNext} onError={setError} />
    </AuthShell>
  );
}

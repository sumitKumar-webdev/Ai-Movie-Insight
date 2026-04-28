import Link from "next/link";
import { BadgePlus } from "lucide-react";

export default function ProfileNotFoundState({
  message,
}: {
  message: string;
}) {
  return (
    <main className="box-border min-h-[calc(100vh-73px)] bg-[#050505] px-3 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-73px-3rem)] w-full max-w-3xl items-center justify-center sm:min-h-[calc(100vh-73px-5rem)]">
        <section className="w-full bg-[#0a0a0a] px-6 py-12 text-center shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:px-10">
          <BadgePlus className="mx-auto h-8 w-8 text-white/60" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Profile not found
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/58 sm:text-base">
            {message}
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-[#141414] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#191919]"
            >
              Back to home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

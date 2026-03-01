import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0d] text-sand-100">
      <header className="border-b border-white/10 bg-[#141414]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-bold text-white">
            TuerSS
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sand-300 transition hover:bg-white/10 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-sand-500 px-4 py-2 font-medium text-white hover:bg-sand-400"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          No code, no problem.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-sand-300">
          Create Roblox Lua scripts with <strong className="text-sand-100">TuerAi</strong> — no coding
          experience needed. Describe what you want; get the script.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row flex-wrap justify-center">
          <Link
            href="/register"
            className="rounded-xl bg-sand-500 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-sand-400"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-sand-200 hover:bg-white/10"
          >
            Log in
          </Link>
          <a
            href="https://tuerss.com/plans"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-sand-500/50 bg-sand-500/10 px-8 py-4 text-lg font-semibold text-sand-200 hover:bg-sand-500/20"
          >
            Buy keys / Plans
          </a>
        </div>
        <p className="mt-8 text-sm text-sand-500">
          New accounts get 20 free generations. Redeem keys in Settings. Support:{" "}
          <a
            href="mailto:support@tuerss.com"
            className="text-sand-400 underline hover:text-sand-300"
          >
            support@tuerss.com
          </a>
        </p>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-sand-500 bg-[#141414]">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="underline hover:text-sand-400">Privacy policy</Link>
          <Link href="/terms" className="underline hover:text-sand-400">Terms of service</Link>
        </div>
        <p className="mt-2">TuerSS — Digital-only. No physical location. No support phone.</p>
      </footer>
    </div>
  );
}

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-sand-100">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href="/"
            className="text-xl font-bold text-white transition hover:opacity-90"
          >
            TuerSS
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-sand-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="btn-shine rounded-xl bg-gradient-to-r from-sand-500 to-sand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sand-500/20 transition-all duration-200 hover:from-sand-400 hover:to-sand-500 hover:shadow-sand-500/30"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          No code, no problem.
        </h1>
        <p className="animate-fade-in-up stagger-1 mt-6 max-w-xl text-lg text-sand-400 opacity-0 [animation-fill-mode:forwards] sm:text-xl">
          Create Roblox Lua scripts with{" "}
          <span className="gradient-text font-semibold">TuerAi</span> — no coding
          experience needed. Describe what you want; get the script.
        </p>
        <div className="animate-fade-in-up stagger-2 mt-12 flex flex-col gap-4 opacity-0 [animation-fill-mode:forwards] sm:flex-row sm:flex-wrap justify-center">
          <Link
            href="/register"
            className="btn-shine rounded-2xl bg-gradient-to-r from-sand-500 to-sand-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-sand-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-sand-500/30"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-sand-200 transition-all duration-300 hover:border-white/30 hover:bg-white/10"
          >
            Log in
          </Link>
          <a
            href="https://tuerss.com/plans"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-sand-500/40 bg-sand-500/10 px-8 py-4 text-lg font-semibold text-sand-200 transition-all duration-300 hover:bg-sand-500/20 hover:border-sand-500/50"
          >
            Buy keys / Plans
          </a>
        </div>
        <p className="animate-fade-in-up stagger-3 mt-12 text-sm text-sand-500 opacity-0 [animation-fill-mode:forwards]">
          New accounts get 20 free generations. Redeem keys in Settings.{" "}
          <a
            href="mailto:support@tuerss.com"
            className="text-sand-400 underline decoration-sand-500/50 underline-offset-2 hover:text-sand-300"
          >
            support@tuerss.com
          </a>
        </p>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-sand-500 bg-[#0a0a0a]">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
          <Link href="/privacy" className="transition hover:text-sand-400">Privacy policy</Link>
          <Link href="/terms" className="transition hover:text-sand-400">Terms of service</Link>
        </div>
        <p className="mt-3">TuerSS — Digital-only. No physical location. No support phone.</p>
      </footer>
    </div>
  );
}

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-sand-300/60 bg-sand-50/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-sand-800">
            TuerSS
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sand-700 hover:bg-sand-200/60"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-sand-500 px-4 py-2 font-medium text-white hover:bg-sand-600"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-sand-900 sm:text-5xl md:text-6xl">
          No code, no problem.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-sand-700">
          Create Roblox Lua scripts with <strong>TuerAi</strong> — no coding
          experience needed. Describe what you want; get the script.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-xl bg-sand-500 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-sand-600"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border-2 border-sand-400 px-8 py-4 text-lg font-semibold text-sand-700 hover:bg-sand-200/60"
          >
            Log in
          </Link>
        </div>
        <p className="mt-8 text-sm text-sand-600">
          New accounts get 20 free generations. Support:{" "}
          <a
            href="mailto:support@tuerss.com"
            className="text-sand-600 underline hover:text-sand-800"
          >
            support@tuerss.com
          </a>
        </p>
      </main>

      <footer className="border-t border-sand-300/60 py-6 text-center text-sm text-sand-600">
        TuerSS — Digital-only. No physical location. No support phone.
      </footer>
    </div>
  );
}

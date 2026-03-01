import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — TuerSS",
  description: "Privacy policy for TuerSS.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-sand-100">
      <header className="border-b border-white/10 bg-[#141414]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-bold text-white">
            TuerSS
          </Link>
          <nav className="flex gap-4">
            <Link href="/" className="text-sm text-sand-400 hover:text-white">Home</Link>
            <Link href="/terms" className="text-sm text-sand-400 hover:text-white">Terms</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sand-500">Last updated: March 2025</p>
        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sand-300">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Information we collect</h2>
            <p>We collect information you provide when you register (email, username, password), when you use the service (scripts, chat with TuerAi), and when you redeem keys or update your profile (including profile picture and preferences).</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">2. How we use it</h2>
            <p>We use your data to operate the service, authenticate you, store your scripts and conversation history, apply your preferences (e.g. theme, AI language), and grant generations from keys. We do not sell your personal data to third parties.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">3. Data storage and security</h2>
            <p>Your data is stored on our infrastructure (including databases and hosting). We use industry-standard practices to protect your data. Passwords are hashed; we do not store plain-text passwords.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">4. Third parties</h2>
            <p>We use third-party services for hosting, database, and AI (e.g. Google Gemini). Content you send to the AI is processed according to their policies. Purchase of keys may be handled by a third-party payment/keys provider; their privacy policy applies to that transaction.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">5. Your rights</h2>
            <p>You can access and update your account and preferences in Settings. You may request deletion of your account and data by contacting us at support@tuerss.com.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">6. Contact</h2>
            <p>For privacy questions or requests, contact us at <a href="mailto:support@tuerss.com" className="text-sand-400 underline hover:text-white">support@tuerss.com</a>.</p>
          </section>
        </div>
        <p className="mt-10">
          <Link href="/" className="text-sand-400 underline hover:text-white">Back to home</Link>
        </p>
      </main>
    </div>
  );
}

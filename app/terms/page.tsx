import Link from "next/link";

export const metadata = {
  title: "Terms of Service — TuerSS",
  description: "Terms of service for TuerSS.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-sand-100">
      <header className="border-b border-white/10 bg-[#141414]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-bold text-white">
            TuerSS
          </Link>
          <nav className="flex gap-4">
            <Link href="/" className="text-sm text-sand-400 hover:text-white">Home</Link>
            <Link href="/privacy" className="text-sm text-sand-400 hover:text-white">Privacy</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sand-500">Last updated: March 2025</p>
        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sand-300">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Acceptance</h2>
            <p>By using TuerSS (“the Service”), you agree to these Terms. If you do not agree, do not use the Service.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">2. Description of service</h2>
            <p>TuerSS provides an AI-assisted tool to help you create Roblox Lua scripts. The Service is offered with a credit-based system. Free accounts receive a limited number of generations and may have a script limit; keys may be purchased or redeemed for additional generations or plans.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">3. Your account and use</h2>
            <p>You are responsible for keeping your account credentials secure and for all activity under your account. You must not use the Service for illegal purposes, to generate harmful code, or to violate any applicable laws or third-party rights. Scripts you create are for your own use; we do not guarantee that generated code is error-free or suitable for any particular purpose.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">4. Keys and credits</h2>
            <p>Keys and credits are non-refundable except as required by law. Keys may expire; unused generations do not carry monetary value. We may change credit rules, limits, or key terms with reasonable notice where feasible.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">5. Intellectual property</h2>
            <p>You retain ownership of the scripts you create. By using the Service you grant us the rights necessary to operate it (e.g. storing and processing your content). Our brand, site, and technology remain our property.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">6. Disclaimers</h2>
            <p>The Service is provided “as is.” We do not warrant uninterrupted or error-free operation. AI-generated code may contain bugs or security issues; you are responsible for reviewing and testing before use.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">7. Limitation of liability</h2>
            <p>To the maximum extent permitted by law, TuerSS and its operators are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">8. Changes and termination</h2>
            <p>We may update these Terms and will post the updated version on the site. Continued use after changes constitutes acceptance. We may suspend or terminate your access for breach of these Terms or for operational reasons.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">9. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@tuerss.com" className="text-sand-400 underline hover:text-white">support@tuerss.com</a>. TuerSS is digital-only; we have no physical location or support phone.</p>
          </section>
        </div>
        <p className="mt-10">
          <Link href="/" className="text-sand-400 underline hover:text-white">Back to home</Link>
        </p>
      </main>
    </div>
  );
}

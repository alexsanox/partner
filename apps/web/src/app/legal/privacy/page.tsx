import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
        <section className="border-b border-white/[0.05] py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">Legal</p>
            <h1 className="mt-3 text-4xl font-black text-white">Privacy Policy</h1>
            <p className="mt-3 text-sm text-[#8b92a8]">Last updated: May 12, 2026</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="space-y-8 text-[#a8b0c4]">
            {[
              {
                title: "1. Information We Collect",
                body: "We collect information you provide directly to us when creating an account, such as your name, email address, and payment information. We also collect usage data, server logs, and technical information about how you interact with our services.",
              },
              {
                title: "2. How We Use Your Information",
                body: "We use the information we collect to provide, maintain, and improve our services, process transactions, send service-related communications, respond to support requests, and comply with legal obligations.",
              },
              {
                title: "3. Payment Data",
                body: "Payment card details are processed by Stripe and never stored on our servers. We only retain a tokenized reference and the last 4 digits of your card for display purposes. Stripe's privacy policy applies to your payment data.",
              },
              {
                title: "4. Data Sharing",
                body: "We do not sell your personal information. We share data only with trusted service providers (such as Stripe for payments, and our datacenter providers for infrastructure) who are contractually obligated to protect it.",
              },
              {
                title: "5. Data Retention",
                body: "We retain your account data for as long as your account is active. Upon account deletion, personal data is removed within 30 days, except where retention is required by law or for fraud prevention.",
              },
              {
                title: "6. Cookies",
                body: "We use essential cookies to maintain your session and preferences. We do not use tracking or advertising cookies. You may disable cookies in your browser settings, though this may affect service functionality.",
              },
              {
                title: "7. Your Rights",
                body: "You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at privacy@partnerhosting.com. We will respond within 30 days.",
              },
              {
                title: "8. Security",
                body: "We implement industry-standard security measures including TLS encryption, access controls, and regular security audits. However, no method of transmission over the internet is 100% secure.",
              },
              {
                title: "9. Contact",
                body: "For privacy-related inquiries, contact us at privacy@partnerhosting.com.",
              },
            ].map((s) => (
              <div key={s.title}>
                <h2 className="text-xl font-bold text-white">{s.title}</h2>
                <p className="mt-3 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

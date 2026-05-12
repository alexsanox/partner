import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
        <section className="border-b border-white/[0.05] py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">Legal</p>
            <h1 className="mt-3 text-4xl font-black text-white">Terms of Service</h1>
            <p className="mt-3 text-sm text-[#8b92a8]">Last updated: May 12, 2026</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="prose prose-invert max-w-none space-y-8 text-[#a8b0c4]">
            {[
              {
                title: "1. Acceptance of Terms",
                body: "By accessing or using PobbleHost services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.",
              },
              {
                title: "2. Use of Services",
                body: "Our services are provided for lawful purposes only. You agree not to use our infrastructure to host, transmit, or distribute any content that is illegal, harmful, or violates the rights of others. We reserve the right to suspend or terminate accounts found in violation without prior notice.",
              },
              {
                title: "3. Payment & Billing",
                body: "Services are billed on a monthly basis. Invoices are generated automatically. Failure to pay within 7 days of the due date may result in service suspension. All payments are processed securely via Stripe and are non-refundable except where required by law.",
              },
              {
                title: "4. Service Availability",
                body: "We target 99.9% uptime as described in our SLA. Scheduled maintenance windows are announced in advance. Unplanned outages will be communicated via our status page. Compensation for downtime beyond SLA thresholds is governed by our SLA document.",
              },
              {
                title: "5. Data & Backups",
                body: "While we provide backup tooling as a feature, you are ultimately responsible for maintaining your own backups of critical data. PobbleHost is not liable for data loss caused by user error, hardware failure, or other circumstances beyond reasonable control.",
              },
              {
                title: "6. Acceptable Use",
                body: "You may not use our servers to conduct DDoS attacks, send spam, host phishing sites, distribute malware, or engage in any activity that causes harm to other users or third parties. Violations will result in immediate termination without refund.",
              },
              {
                title: "7. Limitation of Liability",
                body: "PobbleHost shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our services. Our total liability shall not exceed the amount you paid in the 30 days preceding the claim.",
              },
              {
                title: "8. Changes to Terms",
                body: "We reserve the right to modify these terms at any time. Changes will be communicated via email and posted on this page. Continued use of our services after changes constitutes acceptance of the new terms.",
              },
              {
                title: "9. Contact",
                body: "For questions regarding these terms, contact us at legal@partnerhosting.com.",
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

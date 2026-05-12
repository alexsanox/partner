import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How quickly will my server be ready?",
    answer:
      "Your Minecraft server will be fully deployed and ready to play in under 60 seconds after purchase. Our automated provisioning system handles everything — just log in and connect.",
  },
  {
    question: "What Minecraft versions do you support?",
    answer:
      "We support all Minecraft versions including Java Edition and Bedrock Edition. You can run Vanilla, Spigot, Paper, Fabric, Forge, and many more server types. Switch between versions at any time.",
  },
  {
    question: "Can I install mods and plugins?",
    answer:
      "Absolutely! You have full access to install any mods and plugins you want. Our control panel includes a built-in file manager, and you can also use SFTP for bulk uploads. We support Forge, Fabric, Spigot, Paper, and more.",
  },
  {
    question: "What happens if I need more resources?",
    answer:
      "You can upgrade your plan at any time with zero downtime. The upgrade is instant — your server will immediately have access to additional RAM, storage, and player slots. We'll prorate your billing automatically.",
  },
  {
    question: "Do you offer DDoS protection?",
    answer:
      "Yes, all plans include enterprise-grade DDoS mitigation at no extra cost. Our network infrastructure is designed to absorb and filter malicious traffic, keeping your server online and your players happy.",
  },
  {
    question: "What's your uptime guarantee?",
    answer:
      "We guarantee 99.9% uptime across all plans, backed by our SLA. If we fail to meet this commitment, you'll receive service credits automatically. Our infrastructure is built with redundancy at every level.",
  },
  {
    question: "Can I transfer my existing server?",
    answer:
      "Yes! You can upload your existing world files and server configuration through our control panel or SFTP. If you need help migrating, our support team is available 24/7 to assist you.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express. All transactions are processed securely with PCI-compliant payment processing.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Frequently Asked{" "}
            <span className="text-[#00c98d]">Questions</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Got questions? We&apos;ve got answers.
          </p>
        </div>

        <Accordion className="mt-12">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-white/5"
            >
              <AccordionTrigger className="text-left text-white hover:text-[#4dd9ae] [&[data-state=open]]:text-[#00c98d]">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

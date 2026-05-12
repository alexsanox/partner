import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "noreply@example.com";
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "";
const BRAND = "PobbleHost";

// ── Shared Layout ──────────────────────────────────────────────────

function layout(opts: {
  preheader?: string;
  icon?: string;
  heading: string;
  headingColor?: string;
  body: string;
  cta?: { label: string; url: string; color?: string };
  footer?: string;
}) {
  const accent = "#5b8cff";
  const ctaColor = opts.cta?.color || accent;
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"></head>
<body style="margin:0;padding:0;background-color:#0f1219;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1219;">
  <tr><td align="center" style="padding:40px 16px 0;">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <!-- Logo bar -->
      <tr><td style="padding:0 0 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background:linear-gradient(135deg,${accent},#7c3aed);width:36px;height:36px;border-radius:10px;text-align:center;vertical-align:middle;">
            <span style="font-size:18px;line-height:36px;">&#9889;</span>
          </td>
          <td style="padding-left:12px;font-size:16px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">${BRAND}</td>
        </tr></table>
      </td></tr>
      <!-- Main card -->
      <tr><td style="background-color:#161b27;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
        <!-- Gradient header strip -->
        <div style="height:4px;background:linear-gradient(90deg,${accent},#7c3aed,#ec4899);"></div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:36px 36px 0;">
            ${opts.icon ? `<div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,${accent}22,${accent}11);text-align:center;line-height:52px;font-size:26px;margin-bottom:20px;">${opts.icon}</div>` : ""}
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${opts.headingColor || "#ffffff"};letter-spacing:-0.3px;line-height:1.3;">${opts.heading}</h1>
          </td></tr>
          <tr><td style="padding:12px 36px 32px;">
            ${opts.body}
          </td></tr>
          ${opts.cta ? `<tr><td style="padding:0 36px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="border-radius:10px;background-color:${ctaColor};">
                <a href="${opts.cta.url}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">${opts.cta.label}</a>
              </td>
            </tr></table>
          </td></tr>` : ""}
        </table>
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:28px 0 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:12px;color:#4a5068;">${opts.footer || "You received this email because you have an account with us."}</p>
        <p style="margin:0;font-size:12px;color:#4a5068;">&copy; ${new Date().getFullYear()} ${BRAND} &middot; <a href="${APP_URL()}" style="color:${accent};text-decoration:none;">Visit Dashboard</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#b0b8cd;">${text}</p>`;
}

// Clean, minimal layout — no icons, no banners, just readable content
function simpleLayout(opts: {
  preheader?: string;
  body: string;
  cta?: { label: string; url: string };
  footer?: string;
}) {
  const accent = "#5b8cff";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0c0f16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;">${opts.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0f16;">
<tr><td align="center" style="padding:48px 16px 40px;">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

  <!-- Logo -->
  <tr><td style="padding-bottom:36px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="width:36px;height:36px;background:linear-gradient(135deg,#00c98d,#00a86b);border-radius:9px;text-align:center;vertical-align:middle;">
        <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjgiIHg9IjIiIHk9IjIiIHJ4PSIyIiByeT0iMiIvPjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSI4IiB4PSIyIiB5PSIxNCIgcng9IjIiIHJ5PSIyIi8+PGxpbmUgeDE9IjYiIHgyPSI2LjAxIiB5MT0iNiIgeTI9IjYiLz48bGluZSB4MT0iNiIgeDI9IjYuMDEiIHkxPSIxOCIgeTI9IjE4Ii8+PC9zdmc+" width="20" height="20" alt="" style="display:block;margin:8px auto 0;" />
      </td>
      <td style="padding-left:10px;font-size:15px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Pobble<span style="color:#00c98d;">Host</span></td>
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding-bottom:32px;">
    ${opts.body}
  </td></tr>

  <!-- CTA -->
  ${opts.cta ? `<tr><td style="padding-bottom:40px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="border-radius:8px;background-color:${accent};">
        <a href="${opts.cta.url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">${opts.cta.label}</a>
      </td>
    </tr></table>
  </td></tr>` : ""}

  <!-- Divider + footer -->
  <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
    <p style="margin:0 0 4px;font-size:12px;color:#3d4460;">${opts.footer ?? "You received this email because you have an account with us."}</p>
    <p style="margin:0;font-size:12px;color:#3d4460;">&copy; ${new Date().getFullYear()} ${BRAND}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function infoCard(rows: [string, string, string?][]) {
  const trs = rows.map(([label, value, color]) =>
    `<tr>
      <td style="padding:10px 0;font-size:13px;color:#6b7490;border-bottom:1px solid rgba(255,255,255,0.04);">${label}</td>
      <td style="padding:10px 0;font-size:13px;color:${color || "#e2e8f0"};font-weight:600;text-align:right;border-bottom:1px solid rgba(255,255,255,0.04);">${value}</td>
    </tr>`
  ).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1219;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;margin:0 0 20px;">
    <tr><td style="padding:4px 20px 0;">${trs.replace(/border-bottom:1px solid rgba\(255,255,255,0\.04\);">[^<]*$/, '">')}</td></tr>
  </table>`;
}

function detailTable(rows: [string, string, string?][]) {
  const trs = rows.map(([label, value, color], i) =>
    `<tr>
      <td style="padding:12px 20px;font-size:13px;color:#6b7490;${i < rows.length - 1 ? "border-bottom:1px solid rgba(255,255,255,0.04);" : ""}">${label}</td>
      <td style="padding:12px 20px;font-size:13px;color:${color || "#e2e8f0"};font-weight:600;text-align:right;${i < rows.length - 1 ? "border-bottom:1px solid rgba(255,255,255,0.04);" : ""}">${value}</td>
    </tr>`
  ).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1219;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;margin:0 0 20px;">
    ${trs}
  </table>`;
}

function quoteBlock(text: string) {
  return `<div style="background-color:#0f1219;border:1px solid rgba(255,255,255,0.06);border-left:3px solid #5b8cff;border-radius:0 12px 12px 0;padding:20px;margin:0 0 20px;">
    <p style="margin:0;font-size:14px;line-height:1.7;color:#d1d5e0;white-space:pre-wrap;">${text}</p>
  </div>`;
}

// ── Auth Emails ────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, url: string) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Verify your email address",
    html: layout({
      preheader: "Please verify your email to activate your account.",
      icon: "&#9993;",
      heading: "Verify Your Email",
      body:
        p("Thanks for signing up! Click the button below to verify your email address and get started.") +
        p(`<span style="color:#6b7490;font-size:13px;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</span>`),
      cta: { label: "Verify Email Address &rarr;", url },
    }),
  });
}

export async function sendPasswordResetEmail(email: string, url: string) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Reset your password",
    html: simpleLayout({
      preheader: "Reset your password — this link expires in 1 hour.",
      body: `
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#b0b8cd;">Someone requested a password reset for your account. If that was you, click below to choose a new password.</p>
        <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#b0b8cd;">This link expires in <strong style="color:#e2e8f0;">1 hour</strong>. If you didn't request this, you can ignore this email — nothing will change.</p>
      `,
      cta: { label: "Reset password", url },
      footer: "If you didn't request a password reset, no action is needed.",
    }),
  });
}

export async function sendTwoFactorOTP(email: string, otp: string) {
  const digits = otp.split("").map((d) =>
    `<td style="width:44px;height:52px;background-color:#0f1219;border:1px solid rgba(255,255,255,0.08);border-radius:10px;text-align:center;font-size:24px;font-weight:800;color:#5b8cff;font-family:'SF Mono',monospace;letter-spacing:0;">${d}</td>`
  ).join('<td style="width:8px;"></td>');

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your login code: ${otp}`,
    html: layout({
      preheader: `Your verification code is ${otp}`,
      icon: "&#128272;",
      heading: "Your Login Code",
      body:
        p("Enter this code to complete your sign-in. It expires in <strong style=\"color:#e2e8f0;\">5 minutes</strong>.") +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 24px;"><tr>${digits}</tr></table>` +
        p(`<span style="color:#ef4444;font-size:13px;">&#9888; If you didn't try to sign in, someone may be trying to access your account. Change your password immediately.</span>`),
      footer: "This is an automated security email. Do not share this code with anyone.",
    }),
  });
}

export async function sendChangeEmailVerification(email: string, url: string) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Confirm your new email address",
    html: layout({
      preheader: "Confirm your new email address.",
      icon: "&#9993;",
      heading: "Confirm Email Change",
      body:
        p("You requested to change your email address. Click below to confirm <strong style=\"color:#ffffff;\">" + email + "</strong> as your new email.") +
        p(`<span style="color:#6b7490;font-size:13px;">If you didn't request this change, you can safely ignore this email and your account will remain unchanged.</span>`),
      cta: { label: "Confirm New Email &rarr;", url },
    }),
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to ${BRAND}!`,
    html: layout({
      preheader: `Welcome aboard, ${name}! Your account is ready.`,
      icon: "&#127881;",
      heading: `Welcome, ${name}!`,
      body:
        p("Your account has been created and you're all set. Here's what you can do next:") +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
          <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:36px;height:36px;background-color:rgba(91,140,255,0.1);border-radius:10px;text-align:center;vertical-align:middle;font-size:16px;">&#127918;</td>
              <td style="padding-left:14px;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">Create a Server</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7490;">Launch your Minecraft server in under 60 seconds</p>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:36px;height:36px;background-color:rgba(124,58,237,0.1);border-radius:10px;text-align:center;vertical-align:middle;font-size:16px;">&#9881;</td>
              <td style="padding-left:14px;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">Customize Settings</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7490;">Configure mods, plugins, and server properties</p>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:12px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:36px;height:36px;background-color:rgba(236,72,153,0.1);border-radius:10px;text-align:center;vertical-align:middle;font-size:16px;">&#128172;</td>
              <td style="padding-left:14px;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">Get Support</p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7490;">Our team is here 24/7 if you need help</p>
              </td>
            </tr></table>
          </td></tr>
        </table>`,
      cta: { label: "Create Your First Server &rarr;", url: `${APP_URL()}/dashboard/services/create` },
    }),
  });
}

// ── Billing & Server Emails ────────────────────────────────────────

export async function sendPaymentSuccessEmail(email: string, data: { serverName: string; planName: string; amount: string }) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Payment received — ${data.serverName}`,
    html: layout({
      preheader: `Payment of ${data.amount} received for ${data.serverName}.`,
      icon: "&#9989;",
      heading: "Payment Successful",
      body:
        p(`Your payment of <strong style="color:#ffffff;">${data.amount}</strong> has been processed successfully.`) +
        detailTable([
          ["Server", data.serverName],
          ["Plan", data.planName],
          ["Amount Paid", data.amount, "#5b8cff"],
        ]),
      cta: { label: "View Your Servers &rarr;", url: `${APP_URL()}/dashboard/services` },
    }),
  });
}

export async function sendServerReadyEmail(email: string, data: { serverName: string; planName: string; ip: string; port: number }) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your server is ready — ${data.serverName}`,
    html: layout({
      preheader: `${data.serverName} is online and ready to play!`,
      icon: "&#127918;",
      heading: "Your Server is Ready!",
      body:
        p(`<strong style="color:#ffffff;">${data.serverName}</strong> has been provisioned and is ready to go. Connect using the address below.`) +
        detailTable([
          ["Server", data.serverName],
          ["Plan", data.planName],
          ["Connect Address", `<code style="font-family:'SF Mono',monospace;background-color:rgba(91,140,255,0.1);padding:3px 8px;border-radius:6px;font-size:13px;">${data.ip}:${data.port}</code>`, "#5b8cff"],
        ]) +
        `<div style="background-color:rgba(91,140,255,0.06);border:1px solid rgba(91,140,255,0.15);border-radius:12px;padding:16px 20px;margin:0 0 20px;">
          <p style="margin:0;font-size:13px;color:#7ca3ff;">&#128161; <strong>Quick Tip:</strong> Add the server address to your Minecraft multiplayer list to join instantly.</p>
        </div>`,
      cta: { label: "Manage Server &rarr;", url: `${APP_URL()}/dashboard/services` },
    }),
  });
}

export async function sendPaymentFailedEmail(email: string, data: { serverName: string; planName: string; amount: string }) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Payment failed — ${data.serverName}`,
    html: layout({
      preheader: `Payment of ${data.amount} failed for ${data.serverName}.`,
      icon: "&#10060;",
      heading: "Payment Failed",
      headingColor: "#ef4444",
      body:
        p(`We couldn't process your payment of <strong style="color:#ffffff;">${data.amount}</strong> for <strong style="color:#ffffff;">${data.serverName}</strong>.`) +
        detailTable([
          ["Server", data.serverName],
          ["Plan", data.planName],
          ["Amount Due", data.amount, "#ef4444"],
        ]) +
        `<div style="background-color:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:16px 20px;margin:0 0 20px;">
          <p style="margin:0;font-size:13px;color:#f87171;">&#9888; Your server has been <strong>suspended</strong>. Update your payment method to restore access immediately.</p>
        </div>`,
      cta: { label: "Update Payment Method &rarr;", url: `${APP_URL()}/dashboard/billing`, color: "#ef4444" },
    }),
  });
}

export async function sendSubscriptionCancelledEmail(email: string, data: { serverName: string; planName: string }) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Subscription cancelled — ${data.serverName}`,
    html: layout({
      preheader: `Your subscription for ${data.serverName} has been cancelled.`,
      icon: "&#128683;",
      heading: "Subscription Cancelled",
      body:
        p(`Your subscription for <strong style="color:#ffffff;">${data.serverName}</strong> (${data.planName}) has been cancelled and your server has been removed.`) +
        p("All server data has been deleted. If this was a mistake, you can create a new server anytime.") +
        `<div style="background-color:#0f1219;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;margin:0 0 20px;">
          <p style="margin:0;font-size:13px;color:#6b7490;">&#128218; Need your data back? Contact support within 7 days and we may be able to recover it.</p>
        </div>`,
      cta: { label: "Create New Server &rarr;", url: `${APP_URL()}/dashboard/services/create` },
    }),
  });
}

export async function sendUpcomingRenewalEmail(email: string, data: { serverName: string; planName: string; amount: string; renewalDate: string }) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Upcoming renewal — ${data.serverName}`,
    html: layout({
      preheader: `Your subscription renews on ${data.renewalDate} for ${data.amount}.`,
      icon: "&#128197;",
      heading: "Upcoming Renewal",
      body:
        p(`Your subscription for <strong style="color:#ffffff;">${data.serverName}</strong> will renew soon. Here are the details:`) +
        detailTable([
          ["Server", data.serverName],
          ["Plan", data.planName],
          ["Amount", data.amount, "#5b8cff"],
          ["Renewal Date", data.renewalDate],
        ]) +
        `<div style="background-color:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.15);border-radius:12px;padding:16px 20px;margin:0 0 20px;">
          <p style="margin:0;font-size:13px;color:#fbbf24;">&#128179; Make sure your payment method is up to date to avoid service interruption.</p>
        </div>`,
      cta: { label: "Manage Billing &rarr;", url: `${APP_URL()}/dashboard/billing` },
    }),
  });
}

export async function sendInvoiceEmail(email: string, data: { invoiceNumber: string; serverName: string; amount: string; date: string; pdfUrl: string | null }) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Invoice ${data.invoiceNumber} — ${data.amount}`,
    html: layout({
      preheader: `Invoice ${data.invoiceNumber} for ${data.amount}.`,
      icon: "&#128196;",
      heading: `Invoice ${data.invoiceNumber}`,
      body:
        p(`Here's your invoice for <strong style="color:#ffffff;">${data.serverName}</strong>.`) +
        detailTable([
          ["Invoice Number", data.invoiceNumber],
          ["Date", data.date],
          ["Server", data.serverName],
          ["Amount", data.amount, "#5b8cff"],
        ]),
      cta: data.pdfUrl ? { label: "Download PDF &rarr;", url: data.pdfUrl } : undefined,
      footer: "This invoice was generated automatically. Keep it for your records.",
    }),
  });
}

// ── Support Emails ─────────────────────────────────────────────────

export async function sendTicketReplyEmail(
  email: string,
  data: { ticketId: string; subject: string; message: string; userName?: string },
) {
  const ticketUrl = `${APP_URL()}/dashboard/support/${data.ticketId}`;
  const firstName = data.userName?.split(" ")[0] ?? "there";

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Re: ${data.subject}`,
    html: simpleLayout({
      preheader: `You got a reply on your support ticket: ${data.subject}`,
      body: `
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#b0b8cd;">Hey ${firstName},</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#b0b8cd;">We replied to your support ticket <strong style="color:#e2e8f0;">${data.subject}</strong>.</p>
        <div style="border-left:3px solid #5b8cff;padding:14px 20px;margin:0 0 28px;background-color:#0d1117;border-radius:0 8px 8px 0;">
          <p style="margin:0;font-size:14px;line-height:1.75;color:#c8cdd8;white-space:pre-wrap;">${data.message}</p>
        </div>
        <p style="margin:0 0 32px;font-size:14px;line-height:1.7;color:#6b7490;">Click the button below to view the full conversation and reply.</p>
      `,
      cta: { label: "View ticket", url: ticketUrl },
      footer: "You're receiving this because you opened a support ticket with us.",
    }),
  });
}

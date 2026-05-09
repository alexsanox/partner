import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "noreply@example.com";

export async function sendVerificationEmail(email: string, url: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Verify Your Email</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to verify your email address and activate your account.
        </p>
        <a href="${url}" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          Verify Email
        </a>
        <p style="color: #8b92a8; font-size: 12px; margin-top: 24px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, url: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to reset your password. This link expires in 1 hour.
        </p>
        <a href="${url}" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          Reset Password
        </a>
        <p style="color: #8b92a8; font-size: 12px; margin-top: 24px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendTwoFactorOTP(email: string, otp: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your login code: ${otp}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Your Login Code</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Enter this code to complete your sign-in. It expires in 5 minutes.
        </p>
        <div style="background-color: #1a1e2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #5b8cff; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #8b92a8; font-size: 12px;">
          If you didn't try to sign in, someone may be trying to access your account. Change your password immediately.
        </p>
      </div>
    `,
  });
}

// ── Billing & Server Emails ────────────────────────────────────────

export async function sendPaymentSuccessEmail(email: string, data: { serverName: string; planName: string; amount: string }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Payment received — ${data.serverName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Payment Successful</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Your payment of <strong style="color: #ffffff;">${data.amount}</strong> for <strong style="color: #ffffff;">${data.serverName}</strong> (${data.planName}) has been processed.
        </p>
        <div style="background-color: #1a1e2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Server</td><td style="color: #ffffff; font-size: 13px; text-align: right;">${data.serverName}</td></tr>
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Plan</td><td style="color: #ffffff; font-size: 13px; text-align: right;">${data.planName}</td></tr>
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Amount</td><td style="color: #5b8cff; font-size: 13px; font-weight: 700; text-align: right;">${data.amount}</td></tr>
          </table>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          View Your Servers
        </a>
      </div>
    `,
  });
}

export async function sendServerReadyEmail(email: string, data: { serverName: string; planName: string; ip: string; port: number }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your server is ready — ${data.serverName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Your Server is Ready! 🎮</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          <strong style="color: #ffffff;">${data.serverName}</strong> has been set up and is ready to go.
        </p>
        <div style="background-color: #1a1e2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Server</td><td style="color: #ffffff; font-size: 13px; text-align: right;">${data.serverName}</td></tr>
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Tier</td><td style="color: #ffffff; font-size: 13px; text-align: right;">${data.planName}</td></tr>
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Address</td><td style="color: #5b8cff; font-size: 13px; font-weight: 700; text-align: right; font-family: monospace;">${data.ip}:${data.port}</td></tr>
          </table>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          Manage Server
        </a>
      </div>
    `,
  });
}

export async function sendPaymentFailedEmail(email: string, data: { serverName: string; planName: string; amount: string }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Payment failed — ${data.serverName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ef4444; font-size: 24px; margin-bottom: 16px;">Payment Failed</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          We couldn't process your payment of <strong style="color: #ffffff;">${data.amount}</strong> for <strong style="color: #ffffff;">${data.serverName}</strong> (${data.planName}).
        </p>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Your server has been suspended. Please update your payment method to restore access.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" style="display: inline-block; background-color: #ef4444; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          Update Payment Method
        </a>
      </div>
    `,
  });
}

export async function sendSubscriptionCancelledEmail(email: string, data: { serverName: string; planName: string }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Subscription cancelled — ${data.serverName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Subscription Cancelled</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Your subscription for <strong style="color: #ffffff;">${data.serverName}</strong> (${data.planName}) has been cancelled and your server has been removed.
        </p>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          If this was a mistake, you can create a new server anytime.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services/create" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          Create New Server
        </a>
      </div>
    `,
  });
}

export async function sendUpcomingRenewalEmail(email: string, data: { serverName: string; planName: string; amount: string; renewalDate: string }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Upcoming renewal — ${data.serverName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Upcoming Renewal</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Your subscription for <strong style="color: #ffffff;">${data.serverName}</strong> will renew soon.
        </p>
        <div style="background-color: #1a1e2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Server</td><td style="color: #ffffff; font-size: 13px; text-align: right;">${data.serverName}</td></tr>
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Tier</td><td style="color: #ffffff; font-size: 13px; text-align: right;">${data.planName}</td></tr>
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Amount</td><td style="color: #5b8cff; font-size: 13px; font-weight: 700; text-align: right;">${data.amount}</td></tr>
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Renewal Date</td><td style="color: #ffffff; font-size: 13px; text-align: right;">${data.renewalDate}</td></tr>
          </table>
        </div>
        <p style="color: #8b92a8; font-size: 12px;">
          Make sure your payment method is up to date to avoid service interruption.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Manage Billing
        </a>
      </div>
    `,
  });
}

export async function sendInvoiceEmail(email: string, data: { invoiceNumber: string; serverName: string; amount: string; date: string; pdfUrl: string | null }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Invoice ${data.invoiceNumber} — ${data.amount}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Invoice ${data.invoiceNumber}</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Here's your invoice for <strong style="color: #ffffff;">${data.serverName}</strong>.
        </p>
        <div style="background-color: #1a1e2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Invoice</td><td style="color: #ffffff; font-size: 13px; text-align: right;">${data.invoiceNumber}</td></tr>
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Date</td><td style="color: #ffffff; font-size: 13px; text-align: right;">${data.date}</td></tr>
            <tr><td style="color: #8b92a8; font-size: 13px; padding: 4px 0;">Amount</td><td style="color: #5b8cff; font-size: 13px; font-weight: 700; text-align: right;">${data.amount}</td></tr>
          </table>
        </div>
        ${data.pdfUrl ? `<a href="${data.pdfUrl}" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">Download PDF</a>` : ""}
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome aboard!",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Welcome, ${name}! 🎉</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Your account has been created. You're ready to spin up your first Minecraft server.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services/create" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          Create Your First Server
        </a>
        <p style="color: #8b92a8; font-size: 12px; margin-top: 24px;">
          Need help? Reply to this email and we'll be happy to assist.
        </p>
      </div>
    `,
  });
}

export async function sendTicketReplyEmail(email: string, data: { ticketId: string; subject: string; message: string }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `New reply on your ticket — ${data.subject}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">New Reply on Your Ticket</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Our support team has replied to your ticket: <strong style="color: #ffffff;">${data.subject}</strong>
        </p>
        <div style="background-color: #1a1e2e; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${data.message}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/support/${data.ticketId}" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          View Ticket
        </a>
        <p style="color: #8b92a8; font-size: 12px; margin-top: 24px;">
          You can reply directly from your dashboard.
        </p>
      </div>
    `,
  });
}

export async function sendChangeEmailVerification(email: string, url: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirm your new email address",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Confirm Email Change</h2>
        <p style="color: #8b92a8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to confirm this as your new email address.
        </p>
        <a href="${url}" style="display: inline-block; background-color: #5b8cff; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          Confirm Email
        </a>
        <p style="color: #8b92a8; font-size: 12px; margin-top: 24px;">
          If you didn't request this change, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

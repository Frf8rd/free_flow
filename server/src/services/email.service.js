const nodemailer = require("nodemailer");
const { AppError } = require("../utils/errors");

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const from = (process.env.EMAIL_FROM || "").trim();
  const secure = process.env.SMTP_SECURE || "false";
  if (
    !host ||
    !from ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !["true", "false"].includes(secure)
  ) {
    throw new AppError(503, "EMAIL_NOT_CONFIGURED", "Trimiterea emailurilor nu este configurată.");
  }

  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (Boolean(user) !== Boolean(password)) {
    throw new AppError(503, "EMAIL_NOT_CONFIGURED", "Configurația SMTP este incompletă.");
  }

  return {
    host,
    port,
    secure: secure === "true",
    from,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    ...(user ? { auth: { user, pass: password } } : {}),
  };
}

function getEmailConfig() {
  const from = (process.env.EMAIL_FROM || "").trim();
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const provider = (process.env.EMAIL_PROVIDER || (resendApiKey ? "resend" : "smtp")).trim().toLowerCase();
  if (provider === "resend") {
    if (!resendApiKey) throw new AppError(503, "EMAIL_NOT_CONFIGURED", "Adaugă RESEND_API_KEY pentru trimiterea emailurilor prin HTTP.");
    if (!from) throw new AppError(503, "EMAIL_NOT_CONFIGURED", "EMAIL_FROM trebuie configurat pentru trimiterea emailurilor.");
    return { provider: "resend", apiKey: resendApiKey, from };
  }
  if (provider !== "smtp") throw new AppError(503, "EMAIL_NOT_CONFIGURED", "EMAIL_PROVIDER trebuie să fie smtp sau resend.");
  return { provider: "smtp", ...getSmtpConfig() };
}

async function sendEmail({ to, subject, text }) {
  const config = getEmailConfig();
  try {
    if (config.provider === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: config.from, to: [to], subject, text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        console.error("Email API delivery failed.", { status: response.status });
        throw new Error("Email provider rejected the request.");
      }
      return;
    }
    const transporter = nodemailer.createTransport({
      host: config.host, port: config.port, secure: config.secure,
      connectionTimeout: config.connectionTimeout, greetingTimeout: config.greetingTimeout, socketTimeout: config.socketTimeout,
      ...(config.auth ? { auth: config.auth } : {}),
    });
    try { await transporter.sendMail({ from: config.from, to, subject, text }); }
    finally { transporter.close(); }
  } catch (error) {
    console.error("Email delivery failed.", {
      code: error && typeof error.code === "string" ? error.code : "UNKNOWN",
    });
    throw new AppError(503, "EMAIL_DELIVERY_FAILED", "Emailul nu a putut fi trimis. Încearcă din nou mai târziu.");
  }
}

module.exports = { getSmtpConfig, getEmailConfig, sendEmail };

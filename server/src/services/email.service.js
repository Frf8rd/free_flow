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
    ...(user ? { auth: { user, pass: password } } : {}),
  };
}

async function sendEmail({ to, subject, text }) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.auth ? { auth: config.auth } : {}),
  });

  try {
    await transporter.sendMail({ from: config.from, to, subject, text });
  } catch (error) {
    console.error("Email delivery failed.", {
      code: error && typeof error.code === "string" ? error.code : "UNKNOWN",
    });
    throw new AppError(503, "EMAIL_DELIVERY_FAILED", "Emailul nu a putut fi trimis. Încearcă din nou mai târziu.");
  }
}

module.exports = { getSmtpConfig, sendEmail };

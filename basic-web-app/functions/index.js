const {setGlobalOptions} = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

setGlobalOptions({region: "australia-southeast2", maxInstances: 5});

admin.initializeApp();

const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || "587");
const smtpSecure = /^true$/i.test(process.env.SMTP_SECURE || "false");
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const resetEmailFrom = process.env.RESET_EMAIL_FROM || smtpUser;
const resetContinueUrl = process.env.RESET_CONTINUE_URL || "http://localhost:5173/reset-password";

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn("SMTP configuration incomplete. Check environment variables.");
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: smtpUser ? {
    user: smtpUser,
    pass: smtpPass,
  } : undefined,
});

exports.sendPasswordResetEmail = onCall(async (request) => {
  const email = String(request.data?.email || "").trim();
  if (!email) {
    throw new HttpsError("invalid-argument", "Email is required.");
  }

  try {
    const link = await admin.auth().generatePasswordResetLink(email, {
      url: resetContinueUrl,
      handleCodeInApp: true,
    });

    let appLink = resetContinueUrl;
    try {
      const url = new URL(link);
      const mode = url.searchParams.get("mode") || "resetPassword";
      const oobCode = url.searchParams.get("oobCode") || "";
      const lang = url.searchParams.get("lang") || "en";
      const separator = resetContinueUrl.includes("?") ? "&" : "?";
      appLink = `${resetContinueUrl}${separator}mode=${encodeURIComponent(mode)}&oobCode=${encodeURIComponent(oobCode)}&lang=${encodeURIComponent(lang)}`;
    } catch (parseErr) {
      console.warn("Failed to build custom reset link, falling back to Firebase link:", parseErr);
      appLink = link;
    }

    const mailOptions = {
      from: resetEmailFrom || smtpUser,
      to: email,
      subject: "Reset your U Health password",
      text: `We received a request to reset your U Health password. Use the link below to choose a new password:\n\n${appLink}\n\nIf you did not request this change, you can ignore this email.`,
      html: `<p>Hello,</p>
<p>We received a request to reset your U Health password. Click the button below to choose a new password:</p>
<p><a href="${appLink}" target="_blank" rel="noopener" style="display:inline-block;padding:10px 16px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:4px;">Reset Password</a></p>
<p>If you did not request this change, you can ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);
    return {success: true};
  } catch (err) {
    console.error("sendPasswordResetEmail failed", err);
    throw new HttpsError("internal", "Failed to send reset email.");
  }
});

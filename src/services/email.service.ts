import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import WelcomeEmail from "../templates/WelcomeEmail";
import NewsletterEmail from "../templates/NewsletterEmail";
import { Config } from "../config";

const transporter = nodemailer.createTransport({
  host: Config.SMTP_HOST || "smtp.gmail.com",
  port: Number(Config.SMTP_PORT) || 587,
  secure: Number(Config.SMTP_PORT) === 465,
  auth: {
    user: Config.SMTP_USER,
    pass: Config.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"${Config.SMTP_FROM_NAME || "BetaForge Labs" }" <${Config.SMTP_FROM_EMAIL || "admin@bflabs.tech"}>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  try {
    const emailHtml = await render(WelcomeEmail({ name }));
    await sendEmail(to, "Welcome to the Waitlist!", emailHtml);
  } catch (error) {
    console.error("Error rendering or sending welcome email:", error);
    throw error;
  }
};

interface BulkEmailRecipient {
  email: string;
  name: string;
}

export const sendBulkEmails = async (
  recipients: BulkEmailRecipient[],
  subject: string,
  content?: string,
) => {
  console.log(`Starting bulk email send to ${recipients.length} recipients`);

  // Process in batches to avoid overwhelming the SMTP server
  const BATCH_SIZE = 50;
  const DELAY_BETWEEN_BATCHES_MS = 1000; // 1 second delay

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    console.log(
      `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} emails)`,
    );

    // Process batch concurrently
    await Promise.all(
      batch.map(async (recipient) => {
        try {
          // In a real production app, you might want to pre-render this if it's identical,
          // but for personalized emails (Hello {name}), we render per user.
          // Note: render() can be CPU intensive. For very large lists, consider worker threads.
          const emailHtml = await render(
            NewsletterEmail({ name: recipient.name, content }),
          );

          await sendEmail(recipient.email, subject, emailHtml);
        } catch (error) {
          // Log error but continue with other recipients
          console.error(`Failed to send email to ${recipient.email}:`, error);
        }
      }),
    );

    // Rate limiting delay
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS),
      );
    }
  }

  console.log("Bulk email send completed");
};

import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import WelcomeEmail from "../templates/WelcomeEmail";
import { Config } from "../config";

const transporter = nodemailer.createTransport({
  host: Config.SMTP_HOST,
  port: Number(Config.SMTP_PORT),
  secure: Number(Config.SMTP_PORT) === 465,
  auth: {
    user: Config.SMTP_USER,
    pass: Config.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"${Config.SMTP_FROM_NAME}" <${Config.SMTP_FROM_EMAIL}>`,
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

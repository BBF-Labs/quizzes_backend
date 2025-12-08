import { sendEmail, sendWelcomeEmail } from "./src/services/email.service";
import dotenv from "dotenv";

dotenv.config();

const testEmail = async () => {
    const recipient = process.env.TEST_EMAIL_RECIPIENT || "test@example.com"; // Replace with a valid email if env not set
    console.log(`Attempting to send email to: ${recipient}`);

    try {
        // Test generic email
        console.log("Sending generic test email...");
        await sendEmail(
            recipient,
            "Test Email from Quizzes Backend",
            "<h1>This is a test email</h1><p>If you see this, the email service is working.</p>"
        );
        console.log("Generic email sent successfully.");

        // Test welcome email
        console.log("Sending welcome email...");
        await sendWelcomeEmail(recipient, "Test User");
        console.log("Welcome email sent successfully.");

    } catch (error) {
        console.error("Failed to send email:", error);
    }
};

testEmail();

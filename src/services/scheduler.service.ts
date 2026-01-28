import cron from "node-cron";
import { Waitlist } from "../models";
import { sendBulkEmails, sendWelcomeEmail } from "./email.service";

// Schedule a task to run every day at 9:00 AM (DISABLED: Now triggered manually by admin)
export const initScheduledJobs = () => {
    /*
    cron.schedule("0 9 * * *", async () => {
        // ... (existing logic)
    });
    */

    console.log("Scheduled jobs initialized (Automatic daily waitlist updates disabled)");
};

/**
 * Queues a bulk email job to run in the background
 */
export const queueEmailJob = async (
    recipients: { email: string; name: string }[],
    subject: string,
    content: string,
    onComplete?: () => Promise<void>
) => {
    // Run in the background without awaiting
    runWithRetry(async () => {
        console.log(`Starting queued email job: ${subject}`);
        await sendBulkEmails(recipients, subject, content);
        if (onComplete) {
            await onComplete();
        }
        console.log(`Completed queued email job: ${subject}`);
    }, `Bulk Email Job: ${subject}`).catch(err => {
        console.error(`Fatal error in queued email job ${subject}:`, err);
    });
};

/**
 * Queues a welcome email for a new waitlist user
 */
export const queueWelcomeEmail = async (email: string, name: string) => {
    runWithRetry(async () => {
        console.log(`Sending background welcome email to ${email}`);
        await sendWelcomeEmail(email, name);
    }, `Welcome Email: ${email}`).catch(err => {
        console.error(`Failed to send welcome email to ${email}:`, err);
    });
};

/**
 * Helper function to run a task with retry logic
 * @param task Function to execute
 * @param taskName Name of the task for logging
 * @param maxRetries Maximum number of retries (default: 3)
 * @param initialDelayMs Initial delay in ms before first retry (default: 1000)
 */
export const runWithRetry = async (
    task: () => Promise<void>,
    taskName: string,
    maxRetries: number = 3,
    initialDelayMs: number = 5000
) => {
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            await task();
            return; // Success
        } catch (error) {
            attempt++;
            console.error(`Error in ${taskName} (Attempt ${attempt}/${maxRetries + 1}):`, error);

            if (attempt > maxRetries) {
                console.error(`${taskName} failed after ${maxRetries} retries. Giving up.`);
                // Here you might want to send an alert to admin/slack
                return;
            }

            // Exponential backoff: 5s, 10s, 20s...
            const delay = initialDelayMs * Math.pow(2, attempt - 1);
            console.log(`Retrying ${taskName} in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

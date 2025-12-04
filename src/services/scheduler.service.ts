import cron from "node-cron";
import { Waitlist } from "../models";
import { sendEmail, sendBulkEmails } from "./email.service";

// Schedule a task to run every day at 9:00 AM
export const initScheduledJobs = () => {
    cron.schedule("0 9 * * *", async () => {
        await runWithRetry(async () => {
            console.log("Running daily waitlist summary job...");

            // Use a cursor to stream documents for memory efficiency
            const cursor = Waitlist.find().cursor();

            let batch: { email: string; name: string }[] = [];
            const BATCH_SIZE = 50; // Match the email service batch size or larger
            let totalProcessed = 0;

            for await (const doc of cursor) {
                batch.push({ email: doc.email, name: doc.name });

                if (batch.length >= BATCH_SIZE) {
                    await sendBulkEmails(batch, "Daily Waitlist Update");
                    totalProcessed += batch.length;
                    console.log(`Processed ${totalProcessed} users...`);
                    batch = []; // Clear batch
                }
            }

            // Send remaining users
            if (batch.length > 0) {
                await sendBulkEmails(batch, "Daily Waitlist Update");
                totalProcessed += batch.length;
            }

            console.log(`Daily job completed. Total emails sent: ${totalProcessed}`);
        }, "Daily Waitlist Job");
    });

    console.log("Scheduled jobs initialized");
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

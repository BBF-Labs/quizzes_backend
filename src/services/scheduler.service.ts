import cron from "node-cron";
import { Waitlist } from "../models";
import { sendEmail, sendBulkEmails } from "./email.service";

// Schedule a task to run every day at 9:00 AM
export const initScheduledJobs = () => {
    cron.schedule("0 9 * * *", async () => {
        console.log("Running daily waitlist summary job...");
        try {
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
        } catch (error) {
            console.error("Error in daily job:", error);
        }
    });

    console.log("Scheduled jobs initialized");
};

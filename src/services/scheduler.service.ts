import cron from "node-cron";
import { Waitlist } from "../models";
import { sendEmail } from "./email.service";

// Schedule a task to run every day at 9:00 AM
export const initScheduledJobs = () => {
    cron.schedule("0 9 * * *", async () => {
        console.log("Running daily waitlist summary job...");
        try {
            // Example: Send a summary email to admin
            // In a real app, this might be a drip campaign to users
            const count = await Waitlist.countDocuments();
            console.log(`Total users on waitlist: ${count}`);

            // Placeholder for actual logic
            // await sendEmail("admin@example.com", "Daily Waitlist Summary", \`Total users: \${count}\`);
        } catch (error) {
            console.error("Error in daily job:", error);
        }
    });

    console.log("Scheduled jobs initialized");
};

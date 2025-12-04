import { sendBulkEmails } from "./src/services/email.service";

// Mock recipients
// Generate 60 mock recipients
const recipients = Array.from({ length: 60 }, (_, i) => ({
    email: `test${i + 1}@example.com`,
    name: `Test User ${i + 1}`,
}));

// Ensure specific user is included
recipients[0] = { email: "palomautku1@gmail.com", name: "Paloma Utku" };

async function runTest() {
    console.log("Starting bulk email test...");
    try {
        await sendBulkEmails(recipients, "Test Bulk Email", "This is a test message.");
        console.log("Test completed successfully.");
    } catch (error) {
        console.error("Test failed:", error);
    }
}

runTest();

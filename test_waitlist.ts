import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { addToWaitlist, getWaitlist } from "./src/controllers/waitlist.controller";
import { Request, Response } from "express";

// Mock Express Request and Response
const mockRequest = (body: any = {}) => ({ body } as Request);
const mockResponse = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.data = data;
        return res;
    };
    return res as Response;
};

async function runTests() {
    let mongoServer: MongoMemoryServer;

    try {
        // 1. Start In-Memory MongoDB
        console.log("Starting In-Memory MongoDB...");
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        await mongoose.connect(uri);
        console.log("Connected to In-Memory DB");

        // 2. Test addToWaitlist
        console.log("\n--- Testing addToWaitlist ---");
        const req1 = mockRequest({
            name: "Test User",
            email: "test@example.com",
            university: "Test Uni",
        });
        const res1 = mockResponse();

        await addToWaitlist(req1, res1);
        console.log("Add User Result:", (res1 as any).statusCode, (res1 as any).data);

        // 3. Test Duplicate Entry
        console.log("\n--- Testing Duplicate Entry ---");
        const res2 = mockResponse();
        await addToWaitlist(req1, res2);
        console.log("Duplicate Result:", (res2 as any).statusCode, (res2 as any).data);

        // 4. Test getWaitlist
        console.log("\n--- Testing getWaitlist ---");
        const req3 = mockRequest();
        const res3 = mockResponse();
        await getWaitlist(req3, res3);
        console.log("Get List Result:", (res3 as any).statusCode, (res3 as any).data);

    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        // Cleanup
        await mongoose.disconnect();
        if (mongoServer!) await mongoServer.stop();
        console.log("\nTests Completed");
    }
}

runTests();

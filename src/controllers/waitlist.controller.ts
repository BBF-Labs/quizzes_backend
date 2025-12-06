import { Request, Response } from "express";
import { StatusCodes } from "../config";
import { Waitlist } from "../models";
import { sendWelcomeEmail } from "../services/email.service";

async function addToWaitlist(req: Request, res: Response) {
    try {
        const { name, email, university } = req.body;

        if (!name || !email || !university) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "Please provide name, email, and university",
            });
            return;
        }

        // Email format validation (same as Waitlist model)
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "Please provide a valid email address",
            });
            return;
        }
        const existingUser = await Waitlist.findOne({ email });

        if (existingUser) {
            res.status(StatusCodes.CONFLICT).json({
                message: "You are already on the waitlist!",
            });
            return;
        }

        const newEntry = await Waitlist.create({
            name,
            email,
            university,
        });

        // Send welcome email 
        sendWelcomeEmail(email, name).catch((err: any) =>
            console.error("Failed to send welcome email:", err)
        );

        res.status(StatusCodes.CREATED).json({
            message: "Successfully added to the waitlist",
            data: newEntry,
        });
    } catch (error: any) {
        console.error("Error adding to waitlist:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while adding to the waitlist",
        });
    }
}

async function getWaitlist(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [waitlist, total] = await Promise.all([
            Waitlist.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            Waitlist.countDocuments()
        ]);

        res.status(StatusCodes.OK).json({
            message: "Waitlist retrieved successfully",
            data: waitlist,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error("Error retrieving waitlist:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while retrieving the waitlist",
        });
    }
}

export { addToWaitlist, getWaitlist };

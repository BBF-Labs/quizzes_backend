import { Request, Response } from "express";
import { StatusCodes } from "../config";
import { Waitlist } from "../models";

async function addToWaitlist(req: Request, res: Response) {
    try {
        const { name, email, university } = req.body;

        if (!name || !email || !university) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "Please provide name, email, and university",
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
        const waitlist = await Waitlist.find().sort({ createdAt: -1 });

        res.status(StatusCodes.OK).json({
            message: "Waitlist retrieved successfully",
            data: waitlist,
        });
    } catch (error: any) {
        console.error("Error retrieving waitlist:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while retrieving the waitlist",
        });
    }
}

export { addToWaitlist, getWaitlist };

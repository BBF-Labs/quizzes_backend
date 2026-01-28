import { Request, Response } from "express";
import { StatusCodes } from "../config";
import { Waitlist, EmailUpdate } from "../models";
import { sendWelcomeEmail, sendBulkEmails } from "../services/email.service";
import { generateWaitlistMarkdown } from "../services/aiService";
import { queueEmailJob, queueWelcomeEmail } from "../services/scheduler.service";


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

        // Send welcome email (Queued background job)
        queueWelcomeEmail(email, name);

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

async function batchSendEmails(req: Request, res: Response) {

}


async function generateDailyUpdate(req: Request, res: Response) {
    try {
        const { context } = req.body;

        if (!context) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "Please provide context for the update",
            });
            return;
        }

        const { subject, content } = await generateWaitlistMarkdown(context);

        const newUpdate = await EmailUpdate.create({
            subject,
            content,
            context,
            status: 'draft',
        });

        res.status(StatusCodes.CREATED).json({
            message: "Daily update draft generated",
            data: newUpdate,
        });
    } catch (error: any) {
        console.error("Error generating daily update:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while generating the daily update",
        });
    }
}

async function getPendingUpdate(req: Request, res: Response) {
    try {
        const update = await EmailUpdate.findOne({ status: { $in: ['draft', 'approved'] } }).sort({ createdAt: -1 });

        if (!update) {
            res.status(StatusCodes.NOT_FOUND).json({
                message: "No pending updates found",
            });
            return;
        }

        res.status(StatusCodes.OK).json({
            message: "Pending update retrieved",
            data: update,
        });
    } catch (error: any) {
        console.error("Error retrieving pending update:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while retrieving the pending update",
        });
    }
}

async function approveUpdate(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const update = await EmailUpdate.findById(id);
        if (!update) {
            res.status(StatusCodes.NOT_FOUND).json({
                message: "Update not found",
            });
            return;
        }

        if (update.status === 'sent') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "Update has already been sent and cannot be modified",
            });
            return;
        }

        update.status = 'approved';
        await update.save();

        res.status(StatusCodes.OK).json({
            message: "Update approved successfully",
            data: update,
        });
    } catch (error: any) {
        console.error("Error approving update:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while approving the update",
        });
    }
}

async function sendDailyUpdate(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const update = await EmailUpdate.findById(id);
        if (!update) {
            res.status(StatusCodes.NOT_FOUND).json({
                message: "Update not found",
            });
            return;
        }

        if (update.status !== 'approved') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "Only approved updates can be sent",
            });
            return;
        }

        // Fetch all waitlist users
        const users = await Waitlist.find({}, 'email name');
        const recipients = users.map(u => ({ email: u.email, name: u.name }));

        if (recipients.length === 0) {
            res.status(StatusCodes.OK).json({
                message: "No recipients in the waitlist",
            });
            return;
        }

        // Start bulk email process (queued background job)
        queueEmailJob(recipients, update.subject, update.content, async () => {
            update.status = 'sent';
            update.sentAt = new Date();
            await update.save();
            console.log(`Update ${id} marked as sent in background.`);
        });

        res.status(StatusCodes.ACCEPTED).json({
            message: "Bulk email job queued successfully",
            recipientCount: recipients.length
        });

    } catch (error: any) {
        console.error("Error sending daily update:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while sending the daily update",
        });
    }
}

export { addToWaitlist, getWaitlist, generateDailyUpdate, getPendingUpdate, approveUpdate, sendDailyUpdate };

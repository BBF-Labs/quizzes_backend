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
            if (existingUser.isDeleted) {
                // User re-joined! Restore them.
                existingUser.isDeleted = false;
                existingUser.name = name;
                existingUser.university = university;
                await existingUser.save();

                // Send welcome email again (Queued)
                queueWelcomeEmail(email, name);

                res.status(StatusCodes.OK).json({
                    message: "Welcome back! You've re-joined the waitlist.",
                    data: existingUser,
                });
                return;
            }

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
        const search = req.query.search as string;
        const university = req.query.university as string;
        const showDeleted = req.query.showDeleted === 'true';

        const query: any = showDeleted ? { isDeleted: true } : { isDeleted: { $ne: true } };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }
        if (university) {
            query.university = university;
        }

        const [waitlist, total] = await Promise.all([
            Waitlist.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Waitlist.countDocuments(query)
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

async function deleteFromWaitlist(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const deleted = await Waitlist.findByIdAndUpdate(id, { isDeleted: true });
        if (!deleted) {
            res.status(StatusCodes.NOT_FOUND).json({ message: "User not found in waitlist" });
            return;
        }
        res.status(StatusCodes.OK).json({ message: "User removed from waitlist (Soft delete)" });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

async function unsubscribe(req: Request, res: Response) {
    try {
        const { email } = req.query;
        if (!email) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Email is required" });
            return;
        }
        const deleted = await Waitlist.findOneAndUpdate({ email }, { isDeleted: true });
        if (!deleted) {
            res.status(StatusCodes.NOT_FOUND).json({ message: "Email not found in waitlist" });
            return;
        }
        res.status(StatusCodes.OK).json({ message: "Unsubscribed successfully (Soft delete)" });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

async function generateDailyUpdate(req: Request, res: Response) {
    try {
        const { context, type, links } = req.body;

        if (!context) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "Please provide context for the update",
            });
            return;
        }

        const { subject, content } = await generateWaitlistMarkdown(context, type);

        const newUpdate = await EmailUpdate.create({
            subject,
            content,
            context,
            type: type || 'update',
            links: links || [],
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

async function getAllUpdates(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [updates, total] = await Promise.all([
            EmailUpdate.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            EmailUpdate.countDocuments()
        ]);

        res.status(StatusCodes.OK).json({
            message: "Updates retrieved successfully",
            data: updates,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

async function updateEmailUpdate(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { subject, content } = req.body;

        const update = await EmailUpdate.findById(id);
        if (!update) {
            res.status(StatusCodes.NOT_FOUND).json({ message: "Update not found" });
            return;
        }

        if (update.status === 'sent') {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Cannot edit sent update" });
            return;
        }

        if (subject) update.subject = subject;
        if (content) update.content = content;

        await update.save();
        res.status(StatusCodes.OK).json({ message: "Update optimized", data: update });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
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

        // Automatically trigger send job
        const users = await Waitlist.find({ isDeleted: { $ne: true } }, 'email name');
        const recipients = users.map(u => ({ email: u.email, name: u.name }));

        if (recipients.length > 0) {
            queueEmailJob(recipients, update.subject, update.content, update.type, update.links, async () => {
                update.status = 'sent';
                update.sentAt = new Date();
                await update.save();
                console.log(`Auto-send: Update ${id} marked as sent.`);
            });
        }

        res.status(StatusCodes.OK).json({
            message: "Update approved and queued for sending",
            data: update,
            recipientCount: recipients.length
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

        // Allow sending if approved OR if it's already sent (resending)
        if (update.status === 'draft') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "Only approved or sent updates can be triggered for send",
            });
            return;
        }

        // Fetch all non-deleted waitlist users
        const users = await Waitlist.find({ isDeleted: { $ne: true } }, 'email name');
        const recipients = users.map(u => ({ email: u.email, name: u.name }));

        if (recipients.length === 0) {
            res.status(StatusCodes.OK).json({
                message: "No recipients in the waitlist",
            });
            return;
        }

        // Start bulk email process (queued background job)
        queueEmailJob(recipients, update.subject, update.content, update.type, update.links, async () => {
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

async function restoreFromWaitlist(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const restored = await Waitlist.findByIdAndUpdate(id, { isDeleted: false });
        if (!restored) {
            res.status(StatusCodes.NOT_FOUND).json({ message: "User not found in waitlist" });
            return;
        }
        res.status(StatusCodes.OK).json({ message: "User restored to waitlist successfully" });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

export { 
    addToWaitlist, 
    getWaitlist, 
    deleteFromWaitlist,
    restoreFromWaitlist,
    unsubscribe,
    generateDailyUpdate, 
    getPendingUpdate, 
    getAllUpdates,
    updateEmailUpdate,
    approveUpdate, 
    sendDailyUpdate 
};

import cron from "node-cron";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

cron.schedule("*/30 * * * *", async () => {
    console.log("Checking reminders...");

    const now = new Date();

    const jobs = await Job.find({
        reminderDate: { $lte: now },
        reminderSent: false
    });

    for (let job of jobs) {
        const user = await User.findById(job.userId);

        if (!user) continue;

        await sendEmail(
            user.email,
            `Reminder: ${job.position} at ${job.company}`,
            `Hello ${user.name},

This is a reminder for your job application.

Company: ${job.company}
Position: ${job.position}
Status: ${job.status}

Good luck!

- Job Tracker`
        );

        job.reminderSent = true;
        await job.save();
    }
});
import cron from "node-cron";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

cron.schedule("* * * * *", async () => {
    console.log(`[${new Date().toISOString()}] Checking for reminders...`);

    const now = new Date();
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

    const jobs = await Job.find({
        reminderDate: { $lte: in30Minutes },
        reminderSent: false
    });

    for (let job of jobs) {
        const user = await User.findById(job.userId);

        if (!user) continue;

        await sendEmail(
            user.email,
            `Reminder: ${job.position} at ${job.company}`,
            `Hello ${user.username},

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
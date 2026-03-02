import Job from "../models/Job.js";

// @desc    Get all jobs (Admin: all, User: only assigned jobs)
// @route   GET /api/jobs
// @access  Private
export const getJobs = async (req, res) => {
    try {
        const { status, company, keyword, page = 1, limit = 10 } = req.query;

        let query;
        if (req.user.role === "ADMIN") {
            query = {
                // isArchived: false
            };
        } else {
            query = {
                userId: req.user._id,
                // isArchived: false
            };
        }

        if (status) {
            query.status = status;
        }

        if (company) {
            query.company = { $regex: company, $options: "i" };
        }

        if (keyword) {
            query.$or = [
                { company: { $regex: keyword, $options: "i" } },
                { position: { $regex: keyword, $options: "i" } },
                { notes: { $regex: keyword, $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;

        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Job.countDocuments(query);

        res.json({
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: jobs,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// @desc    Get job by Id
// @route   GET /api/jobs/:id
// @access  Private
export const getJobById = async (req, res) => {
    try {
        const job = await Job.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!job) {
            return res.status(404).json({ message: "Job Application not found" });
        }

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private
export const createJob = async (req, res) => {
    try {
        const { company, position, jobLink, dateApplied, contactPerson, status, note, documents, reminderDate } = req.body;

        // ── Validate required fields
        if (!company || !position) {
            return res.status(400).json({
                success: false,
                message: "Company and position are required.",
            });
        }

        const job = await Job.create({
            userId: req.user._id,
            company,
            position,
            jobLink,
            dateApplied,
            contactPerson,
            status,
            note,
            documents,
            reminderDate
        });

        res.status(201).json({ message: "Job created successfully", job });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// @desc    Update job details
// @route   GET /api/jobs/:id
// @access  Private
export const updateJob = async (req, res) => {
    try {
        const job = await Job.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!job) {
            return res.status(404).json({ message: "Job Application not found" });
        }

        Object.assign(job, req.body);

        const updatedJob = await job.save();

        res.json(updatedJob);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Ownership or admin check
    if (
      job.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await job.deleteOne();

    res.status(200).json({ message: "Job deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update job status
// @route   GET /api/jobs/:id/status
// @access  Private
export const updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job application not found." });
        }

        if (job.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this job application.",
            });
        }

        job.status = status;
        await job.save();

        res.status(200).json({
            success: true,
            message: `Status updated to '${status}'.`,
            job,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// @desc    Add a document to a job application
// @route   POST /api/jobs/:id/documents
// @access  Private
export const addDocument = async (req, res) => {
    try {
        const { name, url, type } = req.body;
        if (!name || !url) {
            return res.status(400).json({
                success: false,
                message: "Document name and url are required.",
            });
        }

        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job application not found." });
        }

        if (job.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to modify this job application.",
            });
        }

        job.documents.push({ name, url, type: type || "other" });
        await job.save();

        res.status(201).json({
            success: true,
            message: "Document added successfully.",
            documents: job.documents,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// @desc    Delete document from a job
// @route   DELETE /api/jobs/:id/documents
// @access  Private
export const deleteDocument = async (req, res) => {
    try {
        const { name, url } = req.body;

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Authorization check
        if (job.userId.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Not authorized" });
        }

        job.documents = job.documents.filter((doc) => !(doc.name === name && doc.url === url));

        await job.save();

        res.status(200).json({
            message: "Document deleted successfully",
            documents: job.documents,
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Dashboard data (Admin-only)
// @route   GET /api/jobs/dashboard-data
// @access  Private
export const getDashboardData = async (req, res) => {
    try {
        // Total applications
        const totalApplications = await Job.countDocuments();

        // Status breakdown
        const statusStats = await Job.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Monthly applications (last 6 months)
        const monthlyStats = await Job.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        // Success rate
        const offers = await Job.countDocuments({ status: "Offer" });
        const successRate =
            totalApplications === 0
                ? 0
                : ((offers / totalApplications) * 100).toFixed(2);

        res.json({
            totalApplications,
            successRate,
            statusStats,
            monthlyStats,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// @desc    Dashboard data (User-specific)
// @route   GET /api/jobs/user-dashboard-data
// @access  Private
export const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;

        // Total applications
        const totalApplications = await Job.countDocuments({
            userId,
            // isArchived: false,
        });

        // Status breakdown
        const statusStats = await Job.aggregate([
            {
                $match: { userId, isArchived: false },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Monthly applications (last 6 months)
        const monthlyStats = await Job.aggregate([
            {
                $match: {
                    userId,
                    isArchived: false,
                    createdAt: {
                        $gte: new Date(
                            new Date().setMonth(new Date().getMonth() - 6)
                        ),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        // Success rate
        const offers = await Job.countDocuments({
            userId,
            status: "Offer",
            isArchived: false,
        });

        const successRate =
            totalApplications === 0
                ? 0
                : ((offers / totalApplications) * 100).toFixed(2);

        res.json({
            totalApplications,
            successRate,
            statusStats,
            monthlyStats,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
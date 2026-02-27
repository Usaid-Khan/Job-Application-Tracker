import Job from "../models/Job.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"

// @desc    Get all users (Admin-only)
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({role: "MEMBER"}).select("-password");

        // Calculating and adding job counts of each user
        const usersWithJobCounts = await Promise.all(users.map(async (user) => {
            const appliedJobs = await Job.countDocuments({assignedTo: user._id, status: "Applied"});
            const screeningJobs = await Job.countDocuments({assignedTo: user._id, status: "Screening"});
            const interviewJobs = await Job.countDocuments({assignedTo: user._id, status: "Interview"});
            const offerJobs = await Job.countDocuments({assignedTo: user._id, status: "Offer"});
            const rejectedJobs = await Job.countDocuments({assignedTo: user._id, status: "Rejected"});

            return {
                ...user._doc,    // Include all existing user data
                appliedJobs,
                screeningJobs,
                interviewJobs,
                offerJobs,
                rejectedJobs
            }
        }));

        res.json(usersWithJobCounts);
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
}

// @desc    Get user by Id
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if(!user) {
            return res.status(404).json({message: "User not found."});
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
}
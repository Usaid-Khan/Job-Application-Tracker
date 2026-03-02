import express from "express"
import { adminOnly, protect } from "../middlewares/authMiddleware.js";
import { addDocument, createJob, deleteDocument, deleteJob, getDashboardData, getJobById, getJobs, getUserDashboardData, updateJob, updateJobStatus } from "../controllers/jobController.js";

const router = express.Router();

router.get("/dashboard-data", protect, adminOnly, getDashboardData);   // See admin's dashboard
router.get("/user-dashboard-data", protect, getUserDashboardData);  // See user's dashboard
router.get("/", protect, getJobs);     // Get all jobs (for Admin: all, for User: assigned)
router.get("/:id", protect, getJobById);    // Get job by Id
router.post("/", protect, createJob);    // Create a job
router.put("/:id", protect, updateJob);     // Update job details
router.delete("/:id", protect, deleteJob);      // Delete a job
router.put("/:id/status", protect, updateJobStatus);    // Update job status
router.post("/:id/document", protect, addDocument);     // Add job document (resume, cover letter etc.)
router.delete("/:id/document", protect, deleteDocument);    // Delete job document

export default router;
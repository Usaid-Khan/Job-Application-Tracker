import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        name: {type: String, required: true},
        url: {type: String, required: true},
        type: {type: String, enum: ["resume", "cover_letter", "job_description", "other"], default: "other"}
    },
    { _id: false }
);

const JobSchema = new mongoose.Schema(
    {
        userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        company: {type: String, required: [true, "Company is required"], trim: true},
        position: {type: String, required: [true, "Position is required"], trim: true},
        jobLink: {type: String, trim: true, default: ''},
        dateApplied: {type: Date, required: true, default: Date.now},
        contactPerson: {type: String, trim: true},
        status: {type: String, enum: ["Applied", "Screening", "Interview", "Offer", "Rejected"], default: "Applied"},
        note: {type: String, trim: true, default: '', maxlength: 1000},
        documents: [documentSchema],
        reminderDate: {type: Date},
    },
    {timestamps: true}
)

export default mongoose.model("Job", JobSchema);
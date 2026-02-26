import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        username: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        profileImageUrl: {type: String, default: null},
        role: {type: String, enum: ["ADMIN", "MEMBER"], default: "MEMBER"},
        careerPreferences: {type: String, trim: true, maxlength: 300}
    },
    {timestamps: true}
);

export default mongoose.model("User", UserSchema);
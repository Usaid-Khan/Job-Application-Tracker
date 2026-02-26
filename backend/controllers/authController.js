import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate JWT Token
export const generateToken = (userId) => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET, {expiresIn: "7d"});
}

// @desc    Register a new User
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const {username, email, password, profileImageUrl, adminInviteToken} = req.body;

        // Check if user already exists
        const userExists = await User.findOne({email});
        if(userExists) {
            return res.status(400).json({message: "User already exists"});
        }

        // Determining user role: Admin if correct token is provided, otherwise Member
        let role = "MEMBER";
        if(adminInviteToken && adminInviteToken == process.env.ADMIN_INVITE_TOKEN) {
            role = "ADMIN";
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            profileImageUrl,
            role
        });

        // Return user data with JWT
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            token: generateToken(user._id)
        })
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({email});
        if(!user) {
            return res.status(401).json({message: "User does not exists."});
        }

        // Comparing password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({message: "Invalid Credentials"});
        }

        // Return user data with JWT
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (requires JWT)
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private (requires JWT)
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;

        if(req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser._id)
        });
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
};
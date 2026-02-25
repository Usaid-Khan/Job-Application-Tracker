require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middlware to handle CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || '*',
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
)

// Middleware
app.use(express.json());

// Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/jobs", jobRoutes);
// app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
    res.send('Server is running 🚀');
})

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
})
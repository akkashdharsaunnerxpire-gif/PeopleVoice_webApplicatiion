require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db/mongoDb");

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parser with larger limit for images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api", require("./Routes/issueRoutes"));
app.use("/api/auth", require("./Routes/authRoutes"));
app.use("/api/admin", require("./Routes/adminRoutes"));
app.use("/api/saved", require("./Routes/savedRoutes"));
app.use("/api/notifications", require("./Routes/notificationRoutes"));
app.use("/api/proofs", require("./Routes/proofRoutes"));
app.use("/api", require("./Routes/uploadRoutes"));

// Catch-all for debugging
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
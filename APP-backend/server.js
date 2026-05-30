require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db/mongoDb");

const app = express();

// ✅ FIXED BODY PARSER
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://peoplevoice-webapplication.onrender.com",
  "capacitor://localhost",
  "http://localhost"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// ✅ Routes
app.use("/api", require("./Routes/issueRoutes"));
app.use("/api/auth", require("./Routes/authRoutes"));
app.use("/api/admin", require("./Routes/adminRoutes"));
app.use("/api/saved", require("./Routes/savedRoutes"));
app.use("/api/notifications", require("./Routes/notificationRoutes"));
app.use("/api/proofs", require("./Routes/proofRoutes"));
app.use("/api/reviews", require("./Routes/reviewRoutes"));
app.use("/api", require("./Routes/uploadRoutes")); // ✅ image upload
app.use("/api/ai", require("./Routes/aiRoutes"));

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5000;

// ✅ DB connect
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
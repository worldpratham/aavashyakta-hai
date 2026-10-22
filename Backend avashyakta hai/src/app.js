const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const env = require("./config/env");
const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ======================================================
// GLOBAL MIDDLEWARES
// ======================================================

// CORS Configuration
const allowedOrigins = [
  env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/local
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// ROOT ROUTE / HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Job Portal Backend is Running",
    environment: env.NODE_ENV,
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Job Portal Backend is Running",
    environment: env.NODE_ENV,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// API ROUTES & DATABASE GUARD
// ======================================================

// Guard database queries when MongoDB is not connected
app.use("/api", (req, res, next) => {
  if (req.path === "/health" || req.path === "/test") {
    return next();
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database Error: MongoDB is not connected (bad auth: authentication failed). Please check MONGODB_URL credentials in 'Backend avashyakta hai/.env'.",
    });
  }
  next();
});

app.use("/api", apiRoutes);

// ======================================================
// SERVE FRONTEND (SINGLE-SERVER ARCHITECTURE)
// ======================================================
const frontendDistPath = path.resolve(__dirname, "../../NEw project Avasyakta hai/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// ======================================================
// ERROR HANDLING MIDDLEWARES
// ======================================================

// 404 Route Not Found
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

module.exports = app;

const app = require("../Backend avashyakta hai/src/app");
const connectDB = require("../Backend avashyakta hai/src/config/db");
const ensureAdminUser = require("../Backend avashyakta hai/src/utils/ensureAdmin");

let isInitialized = false;

// Middleware to ensure DB connection is ready before processing requests
app.use(async (req, res, next) => {
  if (!isInitialized) {
    try {
      await connectDB();
      await ensureAdminUser();
      isInitialized = true;
    } catch (err) {
      console.error("[Vercel API] MongoDB initialization error:", err.message);
    }
  }
  next();
});

module.exports = app;

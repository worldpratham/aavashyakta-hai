const app = require("../Backend avashyakta hai/src/app");
const connectDB = require("../Backend avashyakta hai/src/config/db");
const ensureAdminUser = require("../Backend avashyakta hai/src/utils/ensureAdmin");

let isInitialized = false;

module.exports = async (req, res) => {
  // Ensure database is connected on cold starts
  if (!isInitialized) {
    try {
      await connectDB();
      await ensureAdminUser();
      isInitialized = true;
    } catch (err) {
      console.error("[Vercel API] MongoDB initialization error:", err.message);
    }
  }

  // Ensure req.url retains the /api prefix for Express routing if Vercel stripped it
  if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/?")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }

  // Forward request to Express application
  return app(req, res);
};

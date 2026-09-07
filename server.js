const { execSync } = require("child_process");
const path = require("path");

const backendDir = path.join(__dirname, "Backend avashyakta hai");

try {
  console.log("📝 Starting Backend Server...");
  execSync("node server.js", {
    cwd: backendDir,
    stdio: "inherit",
  });
} catch (error) {
  console.error("❌ Failed to start backend:", error.message || error);
}


const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const backendDir = path.join(__dirname, "Backend avashyakta hai");
const frontendDir = path.join(__dirname, "NEw project Avasyakta hai");
const frontendDist = path.join(frontendDir, "dist");

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.argv.includes("--prod") ||
  process.argv.includes("--production");

console.log("===============================================================");
console.log("🚀 Avashyakta Hai - Single Server & Fullstack Runner");
console.log("===============================================================");

if (isProduction) {
  console.log("📦 Mode: PRODUCTION (Single Server Architecture)");
  console.log("📁 Serving Backend API + Built Frontend from port 5000...");

  if (!fs.existsSync(frontendDist)) {
    console.warn("⚠️ Warning: Frontend 'dist' folder not found!");
    console.warn("💡 Run 'npm run build' first to generate static frontend files.\n");
  }

  const backend = spawn("node", ["server.js"], {
    cwd: backendDir,
    stdio: "inherit",
    shell: true,
  });

  backend.on("close", (code) => {
    process.exit(code || 0);
  });
} else {
  console.log("⚡ Mode: DEVELOPMENT (Concurrent Live-Reloading)");
  console.log("📡 Backend (Express): http://localhost:5000");
  console.log("💻 Frontend (Vite):    http://localhost:5173");
  console.log("===============================================================\n");

  let concurrently;
  try {
    const concModule = require("concurrently");
    concurrently = concModule.concurrently || concModule.default || concModule;
  } catch (e) {
    concurrently = null;
  }

  if (concurrently) {
    const { result } = concurrently(
      [
        {
          command: "npm run dev",
          name: "BACKEND",
          cwd: backendDir,
          prefixColor: "cyan.bold",
        },
        {
          command: "npm run dev",
          name: "FRONTEND",
          cwd: frontendDir,
          prefixColor: "magenta.bold",
        },
      ],
      {
        killOthers: ["failure", "success"],
        restartTries: 0,
      }
    );

    result.catch(() => {
      // Clean exit when processes are killed
    });
  } else {
    // Fallback if concurrently is not yet installed
    const backend = spawn("npm", ["run", "dev"], {
      cwd: backendDir,
      stdio: "inherit",
      shell: true,
    });

    const frontend = spawn("npm", ["run", "dev"], {
      cwd: frontendDir,
      stdio: "inherit",
      shell: true,
    });

    const cleanup = () => {
      if (backend && !backend.killed) backend.kill();
      if (frontend && !frontend.killed) frontend.kill();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }
}

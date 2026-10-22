const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const env = require("./src/config/env");
const ensureAdminUser = require("./src/utils/ensureAdmin");
const Worker = require("./src/models/Worker");

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    await ensureAdminUser();

    // 2. Create HTTP & Socket.io Server
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
      },
    });

    // Make io accessible globally or via req.io if needed
    app.set("io", io);

    // Socket.io Realtime GPS Handlers
    io.on("connection", (socket) => {
      // Worker continuous live GPS update stream
      socket.on("worker_location_update", async (data) => {
        try {
          const { workerId, latitude, longitude, heading, speed, statusText } = data || {};
          if (!workerId || latitude === undefined || longitude === undefined) return;

          const latNum = Number(latitude);
          const lngNum = Number(longitude);
          if (isNaN(latNum) || isNaN(lngNum)) return;

          // Update MongoDB in background
          Worker.findByIdAndUpdate(workerId, {
            latitude: latNum,
            longitude: lngNum,
            geo_location: {
              type: "Point",
              coordinates: [lngNum, latNum],
            },
            available_updated_at: new Date(),
            ...(statusText ? { available_status_text: statusText } : {}),
          }).exec().catch(() => {});

          // Broadcast live movement pin to all recruiters & map watchers
          io.emit("worker_moved", {
            workerId,
            latitude: latNum,
            longitude: lngNum,
            heading: heading || 0,
            speed: speed || 0,
            statusText: statusText || "",
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("[Socket] Error handling worker_location_update:", err.message);
        }
      });

      // Worker toggled availability on / off
      socket.on("worker_status_toggle", (data) => {
        io.emit("worker_status_changed", data);
      });
    });

    server.listen(env.PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 Avashyakta Hai Server is running!`);
      console.log(`📡 URL: http://localhost:${env.PORT}`);
      console.log(`🛰️ Real-time Live GPS Socket: ACTIVE`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`=========================================`);
    });

    // Graceful Shutdown
    const handleShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("[Server] HTTP and Socket server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));

  } catch (error) {
    console.error("[Server] Fatal Startup Error:", error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught Exception thrown:", error);
  process.exit(1);
});

startServer();
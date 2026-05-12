require("dotenv").config();
const app = require("./src/app");
const { sequelize } = require("./src/models");
const http = require("http");
const SocketServer = require("./src/socket");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    const shouldSyncSchema =
      process.env.NODE_ENV !== "production" && process.env.DB_SYNC !== "false";

    if (shouldSyncSchema) {
      await sequelize.sync({ alter: true });
      console.log("Database schema synchronized");
    } else {
      console.log("Database schema sync skipped");
    }

    new SocketServer(server);
    console.log("Socket.IO server initialized");

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();

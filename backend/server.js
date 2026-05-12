require("dotenv").config();
const app = require("./src/app");
const { sequelize } = require("./src/models");
const http = require("http");
const SocketServer = require("./src/socket");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  const columns = await queryInterface.describeTable(tableName);
  if (!columns[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

const ensureDevelopmentSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const { DataTypes } = require("sequelize");

  await addColumnIfMissing(queryInterface, "missions", "badge", {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
  await addColumnIfMissing(queryInterface, "missions", "medal", {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  await addColumnIfMissing(queryInterface, "user_progress", "xp_this_week", {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "user_progress", "words_learned", {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "user_progress", "total_study_minutes", {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "user_progress", "units_completed", {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "user_progress", "lessons_completed", {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  });
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    const shouldSyncSchema =
      process.env.NODE_ENV !== "production" && process.env.DB_SYNC !== "false";

    if (shouldSyncSchema) {
      await sequelize.sync();
      await ensureDevelopmentSchema();
      console.log("Database schema checked");
    } else {
      console.log("Database schema sync skipped");
    }

    const missionService = require("./src/services/mission.service");
    await missionService.seedMissions();
    console.log("Missions synchronized");

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

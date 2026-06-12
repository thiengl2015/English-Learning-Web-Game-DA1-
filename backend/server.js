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

  await addColumnIfMissing(queryInterface, "users", "premium_expires_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });
  await addColumnIfMissing(queryInterface, "users", "subscription_cancelled_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await addColumnIfMissing(queryInterface, "payment_orders", "duration_months", {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
  await addColumnIfMissing(queryInterface, "payment_orders", "premium_expires_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await addColumnIfMissing(queryInterface, "placement_topics", "unit_id", {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "units",
      key: "id",
    },
    onDelete: "SET NULL",
  });
  await addColumnIfMissing(queryInterface, "placement_topics", "unit_order", {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
  await addColumnIfMissing(queryInterface, "placement_test_sessions", "unlock_progress", {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  });
  await addColumnIfMissing(queryInterface, "placement_test_sessions", "updated_at", {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  });

  await addColumnIfMissing(queryInterface, "game_config", "content", {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  });

  // Grammar practice structure: name (tên), formula (công thức), grammar_type (loại).
  await addColumnIfMissing(queryInterface, "grammar", "grammar_type", {
    type: DataTypes.STRING(120),
    allowNull: true,
  });
  await addColumnIfMissing(queryInterface, "grammar", "name", {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
  await addColumnIfMissing(queryInterface, "grammar", "formula", {
    type: DataTypes.STRING(500),
    allowNull: true,
  });

  // Widen lessons.type enum to include 'grammar' (sync() does not alter enums).
  try {
    await sequelize.query(
      "ALTER TABLE lessons MODIFY COLUMN type ENUM('vocabulary','practice','test','grammar') NOT NULL"
    );
  } catch (e) {
    // Ignore if the column already allows 'grammar' or table is mid-migration.
  }

  // Widen notifications.type so campaign/event notifications fit.
  try {
    await sequelize.query(
      "ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'system'"
    );
  } catch (e) {
    // Ignore if already widened.
  }
  await addColumnIfMissing(queryInterface, "notifications", "campaign_id", {
    type: DataTypes.UUID,
    allowNull: true,
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
    await missionService.seedMissions({ initializeUsers: false });
    console.log("Missions synchronized");

// Khởi động SePay Polling Service
    const sepayPollingService = require("./src/services/sepay-polling.service");
    if (process.env.SEPAY_API_TOKEN) {
      sepayPollingService.start();
    }

    const adminNotificationService = require("./src/services/admin-notification.service");
    await adminNotificationService.seedTemplates();
    console.log("Notification templates synchronized");

    new SocketServer(server);
    console.log("Socket.IO server initialized");

    // Periodic delivery of scheduled / conditional notification campaigns.
    const notificationService = require("./src/services/notification.service");
    const NOTIFICATION_TICK_MS = 60 * 1000;
    setInterval(() => {
      notificationService.runTick().catch((err) => {
        console.error("Notification tick failed:", err.message);
      });
    }, NOTIFICATION_TICK_MS);
    console.log("Notification scheduler started");

    // Weekly leaderboard reset: demote the bottom 3 of each league (fires rank_down)
    // and zero weekly XP. Guarded to run once per ISO week (survives restarts).
    const leaderboardService = require("./src/services/leaderboard.service");
    const runWeeklyResetCheck = () =>
      leaderboardService.maybeRunWeeklyReset().catch((err) => {
        console.error("Weekly reset check failed:", err.message);
      });
    runWeeklyResetCheck();
    const WEEKLY_RESET_CHECK_MS = 60 * 60 * 1000;
    setInterval(runWeeklyResetCheck, WEEKLY_RESET_CHECK_MS);
    console.log("Weekly leaderboard reset scheduler started");

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

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler.middleware");

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes will be added here
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "English Learning API",
    version: "1.0.0",
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;

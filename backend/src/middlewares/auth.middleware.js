const { verifyToken } = require("../utils/jwt.util");
const { errorResponse } = require("../utils/response.util");
const { User } = require("../models");

/**
 * Verify JWT token and attach user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "No token provided", 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: {
        exclude: ["password_hash", "reset_token", "reset_token_expires"],
      },
    });

    if (!user) {
      return errorResponse(res, "User not found", 401);
    }

    if (user.status !== "Active") {
      return errorResponse(res, "Account is not active", 403);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

/**
 * Check if user is admin
 */
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return errorResponse(res, "Access denied. Admin only.", 403);
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};

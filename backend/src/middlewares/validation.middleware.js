const { validationResult } = require("express-validator");
const { validationErrorResponse } = require("../utils/response.util");

/**
 * Validate request using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors);
  }
  next();
};

module.exports = validate;

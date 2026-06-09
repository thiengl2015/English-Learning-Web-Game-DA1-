const { validationResult } = require("express-validator");
const { validationErrorResponse } = require("../utils/response.util");

/**
 * Validate request using express-validator, or wrap a Joi schema.
 */
const validateExpressValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors);
  }
  next();
};

const validateJoiSchema = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body || {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: error.details.map((detail) => ({
        msg: detail.message,
        path: detail.path.join("."),
      })),
    });
  }

  req.body = value;
  next();
};

const validate = (schemaOrReq, res, next) => {
  if (schemaOrReq?.validate && typeof schemaOrReq.validate === "function") {
    return validateJoiSchema(schemaOrReq);
  }

  return validateExpressValidator(schemaOrReq, res, next);
};

module.exports = validate;

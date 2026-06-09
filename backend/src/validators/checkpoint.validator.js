const Joi = require("joi");

const startCheckpointSchema = Joi.object({
  checkpointId: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      "string.empty": "checkpointId cannot be empty.",
    }),
});

const submitCheckpointSchema = Joi.object({
  sessionId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "sessionId is required.",
      "number.positive": "sessionId must be a positive integer.",
    }),
  answers: Joi.object()
    .pattern(
      Joi.string().valid("A", "B", "C", "D", "E"),
      Joi.object().pattern(Joi.string(), Joi.any())
    )
    .required()
    .messages({
      "any.required": "answers object is required.",
      "object.pattern": "answers must be organized by section (A, B, C, D, E).",
    }),
  timeSpentSeconds: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      "number.min": "timeSpentSeconds cannot be negative.",
    }),
});

const getResultSchema = Joi.object({
  sessionId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "sessionId is required.",
      "number.positive": "sessionId must be a positive integer.",
    }),
});

module.exports = {
  startCheckpointSchema,
  submitCheckpointSchema,
  getResultSchema,
};

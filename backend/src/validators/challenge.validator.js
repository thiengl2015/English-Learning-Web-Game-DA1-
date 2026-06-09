const Joi = require("joi");

const startChallengeSchema = Joi.object({
  unitId: Joi.number().integer().positive().optional(),
});

const submitChallengeSchema = Joi.object({
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
      Joi.string().valid("A", "B", "C", "D"),
      Joi.object().pattern(Joi.string(), Joi.any())
    )
    .required()
    .messages({
      "any.required": "answers object is required.",
      "object.pattern": "answers must be organized by section (A, B, C, D).",
    }),
  timeSpentSeconds: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      "number.min": "timeSpentSeconds cannot be negative.",
    }),
});

module.exports = {
  startChallengeSchema,
  submitChallengeSchema,
};

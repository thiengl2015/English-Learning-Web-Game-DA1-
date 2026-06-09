const Joi = require("joi");

const generateTestSchema = Joi.object({
  level: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .optional()
    .messages({
      "any.only": "Level must be beginner, intermediate, or advanced.",
    }),
  age: Joi.number()
    .integer()
    .min(8)
    .max(18)
    .optional()
    .messages({
      "number.min": "Age must be at least 8.",
      "number.max": "Age must be at most 18.",
    }),
  topicSlugs: Joi.array()
    .items(Joi.string().min(1).max(100))
    .min(1)
    .max(12)
    .required()
    .messages({
      "array.min": "Select at least one topic slug.",
      "array.max": "Select at most 12 topic slugs.",
      "any.required": "topicSlugs is required.",
    }),
});

const submitTestSchema = Joi.object({
  answers: Joi.object()
    .pattern(Joi.string(), Joi.any())
    .required()
    .messages({
      "any.required": "Answers object is required.",
    }),
});

module.exports = {
  generateTestSchema,
  submitTestSchema,
};

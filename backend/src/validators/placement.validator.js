const Joi = require("joi");

const generateTestSchema = Joi.object({
  level: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .required()
    .messages({
      "any.only": "Level must be beginner, intermediate, or advanced.",
      "any.required": "Level is required.",
    }),
  age: Joi.number()
    .integer()
    .min(8)
    .max(18)
    .required()
    .messages({
      "number.min": "Age must be at least 8.",
      "number.max": "Age must be at most 18.",
      "any.required": "Age is required.",
    }),
  topicSlugs: Joi.array()
    .items(Joi.string().min(1).max(100))
    .length(3)
    .required()
    .messages({
      "array.length": "Exactly 3 topic slugs are required.",
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

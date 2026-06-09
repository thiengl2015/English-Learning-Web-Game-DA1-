const Joi = require("joi");

const feedbackTypes = ["Review", "Suggestion", "Bug Report"];
const feedbackStatuses = ["unread", "read", "resolved"];

const createFeedbackSchema = Joi.object({
  type: Joi.string()
    .valid(...feedbackTypes)
    .required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  message: Joi.string().trim().min(3).max(500).required(),
});

const updateFeedbackStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...feedbackStatuses)
    .required(),
});

module.exports = {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
  feedbackTypes,
  feedbackStatuses,
};

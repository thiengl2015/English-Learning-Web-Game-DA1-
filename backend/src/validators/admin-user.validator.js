const Joi = require("joi");

const updateAdminUserStatusSchema = Joi.object({
  status: Joi.string().valid("Active", "Inactive").required(),
});

module.exports = {
  updateAdminUserStatusSchema,
};

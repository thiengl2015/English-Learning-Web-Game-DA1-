const Joi = require("joi");

const updateUserSettingsSchema = Joi.object({
  push_notifications: Joi.boolean().optional(),
  email_reminders: Joi.boolean().optional(),
  sound_effects: Joi.boolean().optional(),
  background_music: Joi.boolean().optional(),
  music_volume: Joi.number().integer().min(0).max(100).optional(),
  audio_volume: Joi.number().integer().min(0).max(100).optional(),
  dark_mode: Joi.boolean().optional(),
}).min(1);

module.exports = {
  updateUserSettingsSchema,
};

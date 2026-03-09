import Joi from 'joi';

// POST /contact (user creates)
export const createContactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().allow('', null),
  message: Joi.string().trim().min(2).max(5000).required()
});

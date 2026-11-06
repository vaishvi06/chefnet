const Joi = require('joi');

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const passwordErrorMsg = 'Password must be at least 8 characters long and contain at least one letter and one number';

const registerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required(),
    password: Joi.string().pattern(passwordPattern).message(passwordErrorMsg).required(),
    role: Joi.string().valid('customer', 'chef').required(),
    phone: Joi.string().trim().allow(null, '').optional(),
    address: Joi.string().trim().allow(null, '').optional(),
    kitchenName: Joi.string().trim().allow(null, '').optional()
  })
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required(),
    password: Joi.string().required()
  })
};

const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required()
  })
};

const resetPasswordSchema = {
  body: Joi.object({
    password: Joi.string().pattern(passwordPattern).message(passwordErrorMsg).required()
  }),
  params: Joi.object({
    token: Joi.string().required()
  })
};

const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().pattern(passwordPattern).message(passwordErrorMsg).required()
  })
};

const resendVerificationSchema = {
  body: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required()
  })
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  resendVerificationSchema
};

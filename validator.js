const Joi = require("joi");

const validator = (schema) => (payload) =>
    schema.validate(payload);

const signUpSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(1).max(10).required(),
    confirmPassword: Joi.ref("password"),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string(),
});

const todoSchema = Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    completed: Joi.boolean(),
});

exports.validateSignup = validator(signUpSchema);
exports.validateLogin = validator(loginSchema);
exports.validateTodo = validator(todoSchema);
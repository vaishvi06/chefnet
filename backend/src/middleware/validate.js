const AppError = require('../utils/appError');

/**
 * Higher-order middleware to validate req.body, req.query, or req.params against Joi schemas
 * @param {Object} schemas - { body, query, params }
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    const locations = ['body', 'query', 'params'];
    const validationErrors = [];

    for (const loc of locations) {
      if (schemas[loc]) {
        const { error, value } = schemas[loc].validate(req[loc], {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          error.details.forEach((detail) => {
            validationErrors.push({
              location: loc,
              field: detail.path.join('.'),
              message: detail.message.replace(/['"]/g, '')
            });
          });
        } else {
          // Replace with stripped/sanitized value
          req[loc] = value;
        }
      }
    }

    if (validationErrors.length > 0) {
      return next(new AppError('Validation error', 400, validationErrors));
    }

    next();
  };
};

module.exports = validate;

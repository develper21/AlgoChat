import Joi from 'joi';

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'string.empty': 'Reset token is required',
      'any.required': 'Reset token is required'
    }),
    newPassword: Joi.string().min(6).max(128).required().messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 6 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'any.required': 'New password is required'
    })
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required().messages({
      'string.empty': 'Verification token is required',
      'any.required': 'Verification token is required'
    })
  }),

  resendVerification: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    })
  }),

  createRoom: Joi.object({
    isGroup: Joi.boolean().required(),
    name: Joi.when('isGroup', {
      is: true,
      then: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'Group name is required for group chats',
        'string.min': 'Group name must be at least 2 characters long',
        'string.max': 'Group name cannot exceed 50 characters',
        'any.required': 'Group name is required for group chats'
      }),
      otherwise: Joi.optional()
    }),
    memberEmails: Joi.array().items(Joi.string().email()).min(1).required().messages({
      'array.min': 'At least one member is required',
      'any.required': 'Member emails are required'
    })
  }),

  sendMessage: Joi.object({
    roomId: Joi.string().required().messages({
      'string.empty': 'Room ID is required',
      'any.required': 'Room ID is required'
    }),
    text: Joi.string().allow('').max(2000).messages({
      'string.max': 'Message cannot exceed 2000 characters'
    }),
    fileUrl: Joi.string().uri().optional(),
    fileType: Joi.string().optional()
  }).xor('text', 'fileUrl').messages({
    'object.xor': 'Either text message or file is required, not both'
  }),

  editMessage: Joi.object({
    messageId: Joi.string().required().messages({
      'string.empty': 'Message ID is required',
      'any.required': 'Message ID is required'
    }),
    text: Joi.string().max(2000).required().messages({
      'string.empty': 'Message text is required',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message text is required'
    })
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

// Pre-built validation middleware
export const validateRegister = validate(schemas.register);
export const validateLogin = validate(schemas.login);
export const validateForgotPassword = validate(schemas.forgotPassword);
export const validateResetPassword = validate(schemas.resetPassword);
export const validateVerifyEmail = validate(schemas.verifyEmail);
export const validateResendVerification = validate(schemas.resendVerification);
export const validateCreateRoom = validate(schemas.createRoom);
export const validateSendMessage = validate(schemas.sendMessage);
export const validateEditMessage = validate(schemas.editMessage);

export { validate, schemas };

import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware that inspects validation results from express-validator.
 * Returns HTTP 400 Bad Request with formatted error details if validation fails.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.path === "password" ? undefined : err.value
    }));

    return res.status(400).json({
      success: false,
      message: `Validation error: ${formattedErrors[0].message}`,
      errors: formattedErrors
    });
  }
  next();
};

/**
 * Validation rules for user registration (Student-only)
 */
export const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter.")
    .matches(/\d/)
    .withMessage("Password must contain at least one number."),

  body("confirmPassword")
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),

  body("preferredLanguage")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Preferred language cannot exceed 50 characters."),

  body("gradeLevel")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Grade level cannot exceed 100 characters."),

  handleValidationErrors
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required."),

  handleValidationErrors
];

/**
 * Validation rules for forgot password request
 */
export const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Registered email address is required.")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Validation rules for reset password submission
 */
export const validateResetPassword = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Password reset token is required."),

  body("password")
    .notEmpty()
    .withMessage("New password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter.")
    .matches(/\d/)
    .withMessage("Password must contain at least one number."),

  body("confirmPassword")
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validation rules for profile updates
 */
export const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters."),

  body("avatar_url")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("Avatar URL must be a valid URL."),

  body("grade_level")
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body("school_or_college")
    .optional()
    .trim()
    .isLength({ max: 255 }),

  body("learning_style")
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body("preferred_language")
    .optional()
    .trim()
    .isLength({ max: 50 }),

  handleValidationErrors
];

/**
 * Validation rules for UUID route parameter
 */
export const validateUUIDParam = (paramName = "id") => [
  param(paramName)
    .trim()
    .isUUID(4)
    .withMessage(`Invalid ${paramName} parameter. Must be a valid UUID v4.`),
  handleValidationErrors
];

/**
 * Validation rules for lesson creation
 */
export const validateCreateLesson = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Lesson title is required.")
    .isLength({ min: 3, max: 255 })
    .withMessage("Title must be between 3 and 255 characters."),

  body("topic")
    .trim()
    .notEmpty()
    .withMessage("Lesson topic is required.")
    .isLength({ min: 2, max: 255 })
    .withMessage("Topic must be between 2 and 255 characters."),

  body("curriculum_standard")
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body("summary")
    .optional()
    .trim()
    .isLength({ max: 1000 }),

  body("content")
    .optional()
    .isObject()
    .withMessage("Content must be a valid JSON object."),

  handleValidationErrors
];

/**
 * Validation rules for study goal creation
 */
export const validateCreateStudyGoal = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Goal title is required.")
    .isLength({ min: 2, max: 255 })
    .withMessage("Goal title must be between 2 and 255 characters."),

  body("due_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Due date must be a valid ISO 8601 date format (YYYY-MM-DD)."),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be 'low', 'medium', or 'high'."),

  handleValidationErrors
];

/**
 * Validation rules for quiz submission
 */
export const validateQuizSubmission = [
  body("answers")
    .notEmpty()
    .withMessage("Answers payload is required.")
    .isObject()
    .withMessage("Answers must be a key-value object of questionId -> chosenIndex."),

  body("quizId")
    .optional()
    .isUUID(4)
    .withMessage("Quiz ID must be a valid UUID v4."),

  handleValidationErrors
];

/**
 * Validation rules for Socratic AI chat
 */
export const validateSocraticChat = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message content cannot be empty.")
    .isLength({ max: 2000 })
    .withMessage("Message cannot exceed 2000 characters."),

  body("topic")
    .optional()
    .trim()
    .isLength({ max: 255 }),

  body("tutorMode")
    .optional()
    .isIn(["socratic", "first_principles", "eli5", "feynman"])
    .withMessage("Invalid tutor mode specified."),

  handleValidationErrors
];


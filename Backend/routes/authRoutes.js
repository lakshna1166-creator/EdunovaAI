import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  verifyEmail,
  resendVerification
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile
} from "../middleware/validationMiddleware.js";

const router = express.Router();

// Public Authentication Endpoints (Rate Limited & Input Validated)
router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, validateForgotPassword, forgotPassword);
router.post("/reset-password", authLimiter, validateResetPassword, resetPassword);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);

// Protected Student Profile Endpoints (Requires Valid JWT Bearer Token)
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, validateUpdateProfile, updateProfile);

export default router;
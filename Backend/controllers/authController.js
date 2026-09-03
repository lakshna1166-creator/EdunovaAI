import crypto from "crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";
import { sendPasswordResetEmail } from "../config/email.js";

// In-memory token store as fallback if database doesn't have reset_token columns
const passwordResetStore = new Map();

/**
 * Generate a JWT token with standard claims
 */
const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is missing.");
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: "student"
    },
    jwtSecret,
    {
      expiresIn: "7d"
    }
  );
};

/**
 * Register a new Student account (All accounts are automatically students)
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, preferredLanguage, gradeLevel } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required."
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Check user error in Supabase:", checkError);
      return res.status(500).json({
        success: false,
        message: "Failed to verify account availability. Please try again."
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please log in."
      });
    }

    // Hash password with Argon2 (Argon2id best practice)
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    });

    // 1. Insert into users table as 'student'
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        email_verified: true
      })
      .select("id, name, email, created_at")
      .single();

    if (insertError) {
      console.error("Supabase user insert error:", insertError);
      return res.status(500).json({
        success: false,
        message: "Failed to create student account. Please try again later."
      });
    }

    // 2. Insert into student profile table safely
    let profileData = null;
    try {
      const studentPayload = {
        user_id: newUser.id,
        grade_level: gradeLevel || "Undergraduate / General",
        streak_days: 0,
        total_xp: 0,
        learning_style: "Visual & Socratic",
        preferred_language: preferredLanguage || "English"
      };

      const { data: sProfile } = await supabase
        .from("students")
        .insert(studentPayload)
        .select()
        .single();

      if (sProfile) {
        profileData = sProfile;
      }
    } catch (profileErr) {
      console.warn("Optional profile table creation note:", profileErr.message);
    }

    // 3. Generate JWT Token for immediate authenticated session
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: "student",
        profile: profileData || {
          grade_level: gradeLevel || "Undergraduate / General",
          streak_days: 0,
          total_xp: 0
        }
      }
    });
  } catch (error) {
    console.error("Register Exception:", error);
    next(error);
  }
};

/**
 * Login student with email and password
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    const normalizedEmail = email ? email.toLowerCase().trim() : "";

    // Query user record
    const { data: user, error: queryError } = await supabase
      .from("users")
      .select("id, name, email, password, created_at, email_verified")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (queryError) {
      console.error("Login DB Query Error:", queryError);
      return res.status(500).json({
        success: false,
        message: "Authentication service temporarily unavailable."
      });
    }

    const genericAuthErrorMessage = "Invalid email or password";

    if (!user) {
      return res.status(401).json({
        success: false,
        message: genericAuthErrorMessage
      });
    }

    // Verify Argon2 hash
    const isValid = await argon2.verify(user.password, password);
    if (!isValid) {
      return res.status(401).json({ success:false, message: genericAuthErrorMessage });
    }

    // Fetch student profile details
    let profileData = null;
    try {
      const { data: sProfile } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      profileData = sProfile;
    } catch (profErr) {
      console.warn("Profile fetch skipped:", profErr.message);
    }

    // Generate JWT Token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful! Welcome back.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "student",
        profile: profileData || {
          grade_level: "Undergraduate",
          streak_days: 0,
          total_xp: 0
        }
      }
    });
  } catch (error) {
    console.error("Login Exception:", error);
    next(error);
  }
};

/**
 * Logout student session
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully."
  });
};

/**
 * Request Password Reset Link (Sends real email)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required."
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if student exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    // If user does not exist, return success anyway to prevent email enumeration
    if (!user || userError) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate secure crypto reset token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity

    // Store in reset store
    passwordResetStore.set(resetToken, {
      userId: user.id,
      email: user.email,
      expiresAt
    });

    // Persist the token in Supabase so reset links remain valid even if the
    // backend process restarts. The fresh schema always includes these columns.
    const { error: resetTokenUpdateError } = await supabase
      .from("users")
      .update({
        reset_token: resetToken,
        reset_token_expires_at: new Date(expiresAt).toISOString()
      })
      .eq("id", user.id);

    if (resetTokenUpdateError) {
      console.error("Could not store password reset token:", resetTokenUpdateError);
      return res.status(500).json({
        success: false,
        message: "Password reset could not be initialized. Please try again."
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Send actual password reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl, user.name);

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
      previewUrl: emailResult.previewUrl || null
    });
  } catch (error) {
    console.error("Forgot Password Exception:", error);
    next(error);
  }
};

/**
 * Reset Password with Token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required."
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long."
      });
    }

    // Verify token from store
    let resetData = passwordResetStore.get(token);
    let userId = resetData?.userId;

    if (!resetData || resetData.expiresAt < Date.now()) {
      // Check database as fallback
      const { data: dbUser } = await supabase
        .from("users")
        .select("id, email, reset_token, reset_token_expires_at")
        .eq("reset_token", token)
        .maybeSingle();

      if (dbUser && dbUser.reset_token_expires_at && new Date(dbUser.reset_token_expires_at) > new Date()) {
        userId = dbUser.id;
      } else {
        return res.status(400).json({
          success: false,
          message: "Password reset link is invalid or has expired. Please request a new one."
        });
      }
    }

    // Hash new password with Argon2
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    });

    // Update password in database
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Password update error:", updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update password. Please try again."
      });
    }

    // Remove token from memory store
    passwordResetStore.delete(token);

    return res.status(200).json({
      success: true,
      message: "Your password has been updated successfully. Please log in with your new password."
    });
  } catch (error) {
    console.error("Reset Password Exception:", error);
    next(error);
  }
};

/**
 * Get current authenticated student profile
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, created_at")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "Student account not found."
      });
    }

    let profile = null;
    try {
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      profile = student;
    } catch (profErr) {
      console.warn("GetMe profile fetch skipped:", profErr.message);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "student",
        created_at: user.created_at,
        profile: profile || {
          grade_level: "Undergraduate",
          streak_days: 0,
          total_xp: 0,
          learning_style: "Visual & Socratic"
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated student profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, avatar_url, grade_level, school_or_college, learning_style, preferred_language } = req.body || {};

    if (name || avatar_url !== undefined) {
      await supabase
        .from("users")
        .update({
          ...(name && { name: name.trim() }),
          ...(avatar_url !== undefined && { avatar_url }),
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);
    }

    try {
      await supabase
        .from("students")
        .update({
          ...(grade_level && { grade_level }),
          ...(school_or_college && { school_or_college }),
          ...(learning_style && { learning_style }),
          ...(preferred_language && { preferred_language }),
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);
    } catch (err) {
      console.warn("Student profile update skipped:", err.message);
    }

    return res.status(200).json({
      success: true,
      message: "Student profile updated successfully."
    });
  } catch (error) {
    next(error);
  }
};



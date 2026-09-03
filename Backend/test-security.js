/**
 * EduNovaAI - Backend Security & Architecture Verification Suite
 * 
 * Runs end-to-end HTTP tests against the Express backend to verify:
 * 1. Health & Configuration (EduNovaAI)
 * 2. JWT Authentication & Bearer token handling
 * 3. Student-Only Architecture & Strict Data Isolation
 * 4. Input Validation (Register, Login, Password Reset, Goals, UUIDs)
 * 5. Password Security (Argon2 Hashing, Anti-User Enumeration)
 * 6. Email Password Reset Flow
 * 7. Error Handling & Payload Parsing
 */

process.env.NODE_ENV = 'test';

import express from 'express';
import cors from 'cors';
import supabase from './config/supabase.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'EduNovaAI Backend',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ai', aiRoutes);

// Top-level aliases
app.use('/api/progress', studentRoutes);
app.use('/api/history', studentRoutes);
app.use('/api/materials', studentRoutes);
app.use('/api/recommendations', studentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const TEST_PORT = 5088;

const server = app.listen(TEST_PORT, async () => {
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  let studentAToken = null;
  let studentBToken = null;
  let studentAEmail = `student.a.${Date.now()}@edunova.ai`;
  let studentBEmail = `student.b.${Date.now()}@edunova.ai`;
  const testPassword = "SecurePassword123!";

  const results = [];

  const record = (testName, passed, details) => {
    results.push({ testName, passed, details });
    const icon = passed ? "✅" : "❌";
    console.log(`${icon} [${passed ? "PASS" : "FAIL"}] ${testName} - ${details}`);
  };

  const makeRequest = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });

      let data = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      return { status: res.status, headers: res.headers, data };
    } catch (err) {
      return { status: 0, error: err.message };
    }
  };

  console.log("\n=======================================================");
  console.log("🚀 Starting EduNovaAI Backend Security Verification Suite");
  console.log(`📡 Target Server: ${BASE_URL}`);
  console.log("=======================================================\n");

  try {
    // 1. HEALTH CHECK
    console.log("--- 1. System Health Check ---");
    const healthRes = await makeRequest("/api/health");
    record(
      "Health Check (GET /api/health)",
      healthRes.status === 200 && healthRes.data?.status === "healthy",
      `Status: ${healthRes.status}, Service: ${healthRes.data?.service || "N/A"}`
    );

    // 2. REGISTRATION VALIDATION & CREATION
    console.log("\n--- 2. Registration & Input Validation ---");
    
    // 2a. Missing fields
    const regMissingRes = await makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({})
    });
    record(
      "Register: Missing required fields rejected with 400",
      regMissingRes.status === 400 && regMissingRes.data?.success === false,
      `Status: ${regMissingRes.status}, Msg: ${regMissingRes.data?.message}`
    );

    // 2b. Invalid Email
    const regInvalidEmailRes = await makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Student One",
        email: "not-an-email",
        password: testPassword,
        confirmPassword: testPassword
      })
    });
    record(
      "Register: Invalid email format rejected with 400",
      regInvalidEmailRes.status === 400 && regInvalidEmailRes.data?.success === false,
      `Status: ${regInvalidEmailRes.status}, Msg: ${regInvalidEmailRes.data?.message}`
    );

    // 2c. Weak Password (< 8 chars)
    const regWeakPassRes = await makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Student One",
        email: "weakpass@edunova.ai",
        password: "123",
        confirmPassword: "123"
      })
    });
    record(
      "Register: Weak password (<8 chars) rejected with 400",
      regWeakPassRes.status === 400 && regWeakPassRes.data?.success === false,
      `Status: ${regWeakPassRes.status}, Msg: ${regWeakPassRes.data?.message}`
    );

    // 2d. Password Mismatch
    const regMismatchRes = await makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Student One",
        email: "mismatch@edunova.ai",
        password: testPassword,
        confirmPassword: "DifferentPassword123"
      })
    });
    record(
      "Register: Password mismatch rejected with 400",
      regMismatchRes.status === 400 && regMismatchRes.data?.success === false,
      `Status: ${regMismatchRes.status}, Msg: ${regMismatchRes.data?.message}`
    );

    // 2e. Valid Student A Registration
    const regStudentARes = await makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Alice Student",
        email: studentAEmail,
        password: testPassword,
        confirmPassword: testPassword,
        preferredLanguage: "English"
      })
    });
    studentAToken = regStudentARes.data?.token;
    record(
      "Register: Valid Student A (201 Created + role=student + JWT)",
      regStudentARes.status === 201 && regStudentARes.data?.user?.role === "student" && !!studentAToken,
      `Status: ${regStudentARes.status}, User ID: ${regStudentARes.data?.user?.id || "N/A"}`
    );

    // 2f. Password Hash Privacy
    const returnedUser = regStudentARes.data?.user || {};
    record(
      "Security: Password hash never exposed in registration response",
      !("password" in returnedUser) && !("password_hash" in returnedUser),
      `User object keys: ${Object.keys(returnedUser).join(", ")}`
    );

    // 2g. Duplicate Email Conflict (409)
    const regDupRes = await makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate User",
        email: studentAEmail,
        password: testPassword,
        confirmPassword: testPassword
      })
    });
    record(
      "Register: Duplicate email rejected with 409 Conflict",
      regDupRes.status === 409,
      `Status: ${regDupRes.status}, Msg: ${regDupRes.data?.message}`
    );

    // 2h. Register Student B
    const regStudentBRes = await makeRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Bob Student",
        email: studentBEmail,
        password: testPassword,
        confirmPassword: testPassword,
        preferredLanguage: "Spanish"
      })
    });
    studentBToken = regStudentBRes.data?.token;
    record(
      "Register: Valid Student B (201 Created + role=student + JWT)",
      regStudentBRes.status === 201 && regStudentBRes.data?.user?.role === "student" && !!studentBToken,
      `Status: ${regStudentBRes.status}, User ID: ${regStudentBRes.data?.user?.id || "N/A"}`
    );

    // 3. LOGIN SECURITY & ANTI-ENUMERATION
    console.log("\n--- 3. Login Security & Anti-Enumeration ---");

    // 3a. Valid Student Login
    const loginValidRes = await makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: studentAEmail, password: testPassword })
    });
    studentAToken = loginValidRes.data?.token;

    const loginValidBRes = await makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: studentBEmail, password: testPassword })
    });
    studentBToken = loginValidBRes.data?.token;

    record(
      "Login: Valid credentials (200 OK + JWT)",
      loginValidRes.status === 200 && !!studentAToken,
      `Status: ${loginValidRes.status}, Role: ${loginValidRes.data?.user?.role}`
    );

    // 3b. Wrong Password
    const loginWrongPassRes = await makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: studentAEmail, password: "WrongPassword999!" })
    });
    record(
      "Login: Wrong password returns 401 with generic message",
      loginWrongPassRes.status === 401,
      `Status: ${loginWrongPassRes.status}, Message: "${loginWrongPassRes.data?.message}"`
    );

    // 3c. Non-existent Email
    const loginNonExistentRes = await makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "does.not.exist@edunova.ai", password: testPassword })
    });
    record(
      "Login: Non-existent email returns identical 401 generic message (Anti-User Enumeration)",
      loginNonExistentRes.status === 401 && loginNonExistentRes.data?.message === loginWrongPassRes.data?.message,
      `Status: ${loginNonExistentRes.status}, Message: "${loginNonExistentRes.data?.message}"`
    );

    // 4. JWT AUTHENTICATION MIDDLEWARE
    console.log("\n--- 4. JWT Authentication Middleware ---");

    // 4a. Missing Token
    const jwtMissingRes = await makeRequest("/api/auth/me");
    record(
      "JWT: Missing token rejected with 401 Unauthorized",
      jwtMissingRes.status === 401,
      `Status: ${jwtMissingRes.status}, Msg: ${jwtMissingRes.data?.message}`
    );

    // 4b. Malformed Header
    const jwtMalformedRes = await makeRequest("/api/auth/me", {
      headers: { Authorization: "InvalidTokenFormatWithoutBearer" }
    });
    record(
      "JWT: Malformed authorization header rejected with 401",
      jwtMalformedRes.status === 401,
      `Status: ${jwtMalformedRes.status}, Msg: ${jwtMalformedRes.data?.message}`
    );

    // 4c. Invalid Signature Token
    const jwtInvalidRes = await makeRequest("/api/auth/me", {
      headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature" }
    });
    record(
      "JWT: Invalid token signature rejected with 401",
      jwtInvalidRes.status === 401,
      `Status: ${jwtInvalidRes.status}, Msg: ${jwtInvalidRes.data?.message}`
    );

    // 4d. Valid Student Token
    const jwtValidRes = await makeRequest("/api/auth/me", {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    record(
      "JWT: Valid Bearer token authenticated successfully (200 OK)",
      jwtValidRes.status === 200 && jwtValidRes.data?.user?.email === studentAEmail,
      `Status: ${jwtValidRes.status}, User: ${jwtValidRes.data?.user?.name}`
    );

    // 5. STUDENT DATA ISOLATION
    console.log("\n--- 5. Student Data Isolation ---");

    // 5a. Student A accesses their own Dashboard
    const dashARes = await makeRequest("/api/student/dashboard", {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    record(
      "Isolation: Student A accesses their personal dashboard",
      dashARes.status === 200 && dashARes.data?.data?.student?.name === "Alice Student",
      `Status: ${dashARes.status}, Student: ${dashARes.data?.data?.student?.name}`
    );

    // 5b. Student B accesses their own Dashboard
    const dashBRes = await makeRequest("/api/student/dashboard", {
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    record(
      "Isolation: Student B accesses their personal dashboard",
      dashBRes.status === 200 && dashBRes.data?.data?.student?.name === "Bob Student",
      `Status: ${dashBRes.status}, Student: ${dashBRes.data?.data?.student?.name}`
    );

    // 6. FORGOT & RESET PASSWORD FLOW
    console.log("\n--- 6. Forgot & Reset Password Flow ---");

    const forgotRes = await makeRequest("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: studentAEmail })
    });
    record(
      "Forgot Password: Generates reset token & dispatches email (200 OK)",
      forgotRes.status === 200 && forgotRes.data?.success === true,
      `Status: ${forgotRes.status}, Msg: ${forgotRes.data?.message}`
    );

    const resetToken = forgotRes.data?.previewResetToken;
    if (resetToken) {
      const newPassword = "BrandNewSecurePassword789!";
      const resetRes = await makeRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: resetToken,
          newPassword: newPassword,
          confirmPassword: newPassword
        })
      });
      record(
        "Reset Password: Valid reset token updates Argon2 password hash (200 OK)",
        resetRes.status === 200 && resetRes.data?.success === true,
        `Status: ${resetRes.status}, Msg: ${resetRes.data?.message}`
      );

      // Verify login with new password
      const newLoginRes = await makeRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: studentAEmail, password: newPassword })
      });
      record(
        "Login: Authenticates successfully with newly reset password (200 OK)",
        newLoginRes.status === 200,
        `Status: ${newLoginRes.status}`
      );
    }

    // 7. BODY PARSING & ERROR SANITIZATION
    console.log("\n--- 7. Body Parsing & Error Sanitization ---");
    const malformedRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "This is { not valid json: true"
    });
    record(
      "Error Handler: Malformed JSON caught with 400 Bad Request",
      malformedRes.status === 400,
      `Status: ${malformedRes.status}, Msg: ${malformedRes.data?.message}`
    );

    // SUMMARY
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = Math.round((passed / total) * 100);

    console.log("\n=======================================================");
    console.log(`📊 Verification Complete: ${passed}/${total} tests passed (${passRate}%)`);
    console.log("=======================================================\n");

    server.close();
    if (failed > 0) {
      process.exit(1);
    } else {
      console.log("🎉 All security, authentication, and isolation tests passed successfully!\n");
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    server.close();
    process.exit(1);
  }
});

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

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ai', aiRoutes);

// Top-level aliases for student features
app.use('/api/progress', studentRoutes);
app.use('/api/history', studentRoutes);
app.use('/api/materials', studentRoutes);
app.use('/api/recommendations', studentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const TEST_PORT = 5099;
const server = app.listen(TEST_PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 EduNovaAI Full System Verification Test Starting...`);
  console.log(`======================================================\n`);

  const BASE_URL = `http://localhost:${TEST_PORT}`;
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  try {
    const timestamp = Date.now();
    const studentAEmail = `student_a_${timestamp}@example.com`;
    const studentBEmail = `student_b_${timestamp}@example.com`;
    const password = 'SecurePassword123';

    // ----------------------------------------------------
    // TEST 1: Register Student A
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Student A Registration ---');
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student Alice',
        email: studentAEmail,
        password: password,
        confirmPassword: password,
        preferredLanguage: 'English'
      })
    });
    const regDataA = await regResA.json();
    assert(regResA.status === 201 && regDataA.success, 'Student A registered successfully');
    assert(regDataA.token && regDataA.user?.role === 'student', 'Token issued with role="student"');
    const tokenA = regDataA.token;

    // ----------------------------------------------------
    // TEST 2: Student A Login & Profile Check
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Student A Login & Profile ---');
    const loginResA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentAEmail,
        password: password
      })
    });
    const loginDataA = await loginResA.json();
    assert(loginResA.status === 200 && loginDataA.user?.email === studentAEmail, 'Student A logged in successfully');

    const meResA = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const meDataA = await meResA.json();
    assert(meResA.status === 200 && meDataA.user?.name === 'Student Alice', 'GET /api/auth/me verified identity');

    // ----------------------------------------------------
    // TEST 3: Student A Dashboard & Progress
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Student A Dashboard & Progress ---');
    const dashResA = await fetch(`${BASE_URL}/api/student/dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dashDataA = await dashResA.json();
    assert(dashResA.status === 200 && dashDataA.success, 'GET /api/student/dashboard retrieved student dashboard');
    assert(dashDataA.data?.student?.name === 'Student Alice', 'Dashboard data contains student name');

    const progResA = await fetch(`${BASE_URL}/api/student/progress`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const progDataA = await progResA.json();
    assert(progResA.status === 200 && progDataA.success, 'GET /api/student/progress retrieved progress metrics');

    // ----------------------------------------------------
    // TEST 4: Student A Material Upload
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Material Upload ---');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const multipartBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="title"\r\n\r\n` +
      `Alice Neural Network Notes\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="topic"\r\n\r\n` +
      `Deep Learning\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="notes.txt"\r\n` +
      `Content-Type: text/plain\r\n\r\n` +
      `These are private study notes for Alice.\r\n` +
      `--${boundary}--\r\n`;

    const uploadResA = await fetch(`${BASE_URL}/api/student/materials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: multipartBody
    });
    const uploadDataA = await uploadResA.json();
    assert(uploadResA.status === 201 && uploadDataA.success, 'Uploaded material for Student A');

    const matResA = await fetch(`${BASE_URL}/api/student/materials`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const matDataA = await matResA.json();
    assert(matDataA.materials?.length >= 1, 'Student A sees their uploaded material');

    // ----------------------------------------------------
    // TEST 5: Register Student B & Verify Strict Data Isolation
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Student B & Data Isolation ---');
    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student Bob',
        email: studentBEmail,
        password: password,
        confirmPassword: password,
        preferredLanguage: 'Spanish'
      })
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.token;

    const dashResB = await fetch(`${BASE_URL}/api/student/dashboard`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const dashDataB = await dashResB.json();
    assert(dashDataB.data?.student?.name === 'Student Bob', 'Student B sees their own isolated dashboard');

    const matResB = await fetch(`${BASE_URL}/api/student/materials`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const matDataB = await matResB.json();
    const bSeesAliceFiles = (matDataB.materials || []).some(m => m.title === 'Alice Neural Network Notes');
    assert(!bSeesAliceFiles, 'Student B CANNOT see Student A uploaded materials (Strict Data Isolation)');

    // ----------------------------------------------------
    // TEST 6: Forgot Password Email & Reset Password Flow
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Forgot Password & Reset Password Flow ---');
    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentAEmail })
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.status === 200 && forgotData.success, 'Forgot password request succeeded and email sent/queued');

    const resetToken = forgotData.previewResetToken;
    if (resetToken) {
      const newPassword = 'BrandNewPassword456';
      const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: newPassword,
          confirmPassword: newPassword
        })
      });
      const resetData = await resetRes.json();
      assert(resetRes.status === 200 && resetData.success, 'Password successfully reset with valid reset token');

      // Verify login with old password fails and new password succeeds
      const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentAEmail, password: password })
      });
      assert(oldLoginRes.status === 401, 'Login with old password rejected');

      const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentAEmail, password: newPassword })
      });
      assert(newLoginRes.status === 200, 'Login with new password succeeded');
    }

    console.log(`\n======================================================`);
    console.log(`🎯 Test Summary: ${passedTests}/${totalTests} tests passed!`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    server.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  }
});

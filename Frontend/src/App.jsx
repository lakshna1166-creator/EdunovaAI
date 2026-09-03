import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth Context & Route Protection
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Layout & Helpers
import Layout from './components/common/Layout';
import ScrollToTop from './components/common/ScrollToTop';

// Public Pages
import HomePage from './pages/public/HomePage';
import FeaturesPage from './pages/public/FeaturesPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import LoginPage from './pages/public/LoginPage';
import SignupPage from './pages/public/SignupPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import StudentIntroPage from './pages/public/StudentIntroPage';

// Student Protected Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StartLearning from './pages/student/StartLearning';
import ProgressPage from './pages/student/ProgressPage';
import HistoryPage from './pages/student/HistoryPage';
import LearningProfile from './pages/student/LearningProfile';
import LessonPage from './pages/student/LessonPage';
import AITeacherPage from './pages/student/AITeacherPage';
import QuizPage from './pages/student/QuizPage';
import ReportPage from './pages/student/ReportPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Ensure window scrolls to top on route change */}
        <ScrollToTop />

        <Routes>
          {/* Public Routes with Shared Navbar and Footer */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="student" element={<StudentIntroPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Protected Student Suite Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learning-setup"
            element={
              <ProtectedRoute>
                <StartLearning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <LearningProfile />
              </ProtectedRoute>
            }
          />

          {/* Interactive Student Sessions */}
          <Route
            path="/student/dashboard"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/student/start-learning"
            element={<Navigate to="/learning-setup" replace />}
          />
          <Route
            path="/student/progress"
            element={<Navigate to="/progress" replace />}
          />
          <Route
            path="/student/history"
            element={<Navigate to="/history" replace />}
          />
          <Route
            path="/student/learning-profile"
            element={<Navigate to="/profile" replace />}
          />
          <Route
            path="/student/lesson"
            element={
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/teacher"
            element={
              <ProtectedRoute>
                <AITeacherPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/quiz"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/report"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

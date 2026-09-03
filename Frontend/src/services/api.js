/**
 * EduNovaAI - Frontend API Service Client
 * Handles HTTP requests, JWT authorization headers, session persistence, and student data isolation
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get stored JWT token
 */
export const getToken = () => {
  return localStorage.getItem('edunova_token') || localStorage.getItem('edumind_token');
};

/**
 * Store JWT token and student user info
 */
export const setAuthSession = (token, user) => {
  if (token) {
    localStorage.setItem('edunova_token', token);
    localStorage.removeItem('edumind_token');
  }
  if (user) {
    localStorage.setItem('edunova_user', JSON.stringify(user));
    localStorage.removeItem('edumind_user');
  }
};

/**
 * Clear stored auth session
 */
export const clearAuthSession = () => {
  localStorage.removeItem('edunova_token');
  localStorage.removeItem('edunova_user');
  localStorage.removeItem('edumind_token');
  localStorage.removeItem('edumind_user');
};

/**
 * Get current stored student user
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('edunova_user') || localStorage.getItem('edumind_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Core Fetch Wrapper
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

// ============================================================================
// STUDENT AUTHENTICATION API
// ============================================================================
export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmail: (payload) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(payload) }),
  resendVerification: (payload) => request('/auth/resend-verification', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me', { method: 'GET' }),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) })
};

// ============================================================================
// STUDENT DATA & LEARNING API (Strictly isolated by authenticated student)
// ============================================================================
export const studentApi = {
  getDashboard: () => request('/student/dashboard', { method: 'GET' }),
  getProfile: () => request('/student/profile', { method: 'GET' }),
  updateProfile: (payload) => request('/student/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getCourses: () => request('/student/courses', { method: 'GET' }),
  getGoals: () => request('/student/goals', { method: 'GET' }),
  createGoal: (goal) => request('/student/goals', { method: 'POST', body: JSON.stringify(goal) }),
  getProgress: () => request('/student/progress', { method: 'GET' }),
  getHistory: () => request('/student/history', { method: 'GET' }),
  getMaterials: () => request('/student/materials', { method: 'GET' }),
  uploadMaterial: (formData) => request('/student/material/upload', { method: 'POST', body: formData }),
  getRecommendations: () => request('/student/recommendations', { method: 'GET' })
};

// ============================================================================
// AI SOCRATIC TUTOR & LESSON GENERATION API
// ============================================================================
export const aiApi = {
  chat: (payload) => request('/ai/chat', { method: 'POST', body: JSON.stringify(payload) }),
  explainDifferently: (payload) => request('/ai/explain-differently', { method: 'POST', body: JSON.stringify(payload) }),
  generateLesson: (payload) => request('/ai/generate-lesson', { method: 'POST', body: JSON.stringify(payload) })
};

// ============================================================================
// QUIZ ENGINE API
// ============================================================================
export const quizApi = {
  getQuestions: (lessonId) => request(`/quiz${lessonId ? `?lessonId=${lessonId}` : ''}`, { method: 'GET' }),
  submitQuiz: (payload) => request('/quiz/submit', { method: 'POST', body: JSON.stringify(payload) })
};

// ============================================================================
// ANALYTICS API
// ============================================================================
export const analyticsApi = {
  getMasteryMap: () => request('/analytics/mastery-map', { method: 'GET' }),
  getMisconceptions: () => request('/analytics/misconceptions', { method: 'GET' })
};

export default {
  auth: authApi,
  student: studentApi,
  ai: aiApi,
  quiz: quizApi,
  analytics: analyticsApi
};

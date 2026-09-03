import express from "express";
import multer from "multer";
import {
  getStudentDashboard,
  getStudentProfile,
  getCourses,
  getStudyGoals,
  createStudyGoal,
  getProgress,
  getHistory,
  getMaterials,
  uploadMaterial,
  getRecommendations
} from "../controllers/studentController.js";
import { updateProfile } from "../controllers/authController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import {
  validateCreateStudyGoal,
  validateUpdateProfile
} from "../middleware/validationMiddleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB file upload limit
});

const router = express.Router();

// All student endpoints require authenticated JWT Bearer token AND 'student' role
router.use(authMiddleware);
router.use(requireRole("student"));

// Dashboard & Profile
router.get("/dashboard", getStudentDashboard);
router.get("/profile", getStudentProfile);
router.put("/profile", validateUpdateProfile, updateProfile);

// Courses & Goals
router.get("/courses", getCourses);
router.get("/goals", getStudyGoals);
router.post("/goals", validateCreateStudyGoal, createStudyGoal);

// Progress & History
router.get("/progress", getProgress);
router.get("/history", getHistory);

// Materials & Upload
router.get("/materials", getMaterials);
router.post("/materials", upload.single("file"), uploadMaterial);
router.post("/material/upload", upload.single("file"), uploadMaterial);
router.post("/materials/upload", upload.single("file"), uploadMaterial);

// Recommendations
router.get("/recommendations", getRecommendations);

export default router;

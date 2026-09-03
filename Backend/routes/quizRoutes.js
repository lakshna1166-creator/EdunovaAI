import express from "express";
import { getQuizQuestions, submitQuiz } from "../controllers/quizController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateQuizSubmission } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.get("/", getQuizQuestions);

router.post(
  "/submit",
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authMiddleware(req, res, next);
    }
    next();
  },
  validateQuizSubmission,
  submitQuiz
);

export default router;


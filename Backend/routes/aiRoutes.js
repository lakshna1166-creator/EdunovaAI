import express from "express";
import { socraticChat, explainDifferently, generateLesson } from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Allow both public test and authenticated requests
router.post("/chat", (req, res, next) => {
  // Optional auth: if token is present, decode it, otherwise continue
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authMiddleware(req, res, next);
  }
  next();
}, socraticChat);

router.post("/explain-differently", explainDifferently);
router.post("/generate-lesson", generateLesson);

export default router;

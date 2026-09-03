import express from "express";
import { getMasteryMap, getMisconceptionsSummary } from "../controllers/analyticsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected analytics endpoints (Requires valid JWT)
router.use(authMiddleware);

router.get("/mastery-map", getMasteryMap);
router.get("/misconceptions", getMisconceptionsSummary);

export default router;


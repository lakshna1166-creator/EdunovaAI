import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables before any configuration
dotenv.config();

// Configuration & Clients
import supabase from "./config/supabase.js";
import { verifyEmailTransport } from "./config/email.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

// Middlewares & UI
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { renderInteractiveDashboard } from "./views/interactiveDashboard.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================================================
// SECURITY HEADERS (Helmet)
// ============================================================================
app.use(
  helmet({
    contentSecurityPolicy: false, // Permitted for interactive dashboard web view
    crossOriginEmbedderPolicy: false
  })
);

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
const isProduction = process.env.NODE_ENV === "production";
const configuredFrontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim()).filter(Boolean)
  : [];

const defaultDevOrigins = [
  "https://edunova-ai-delta.vercel.app"
];

const allowedOrigins = isProduction
  ? configuredFrontendUrls
  : [...new Set([...defaultDevOrigins, ...configuredFrontendUrls])];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || !isProduction) {
      return callback(null, true);
    }

    return callback(new Error(`CORS Error: Origin '${origin}' is not authorized.`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ============================================================================
// REQUEST BODY PARSING & SIZE LIMITING (DDoS & Memory Exhaustion Protection)
// ============================================================================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Request logger for development
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ============================================================================
// INTERACTIVE API EXPLORER & DASHBOARD (Root)
// ============================================================================
let schemaSqlContent = "";
try {
  const schemaPath = path.join(__dirname, "database", "schema.sql");
  if (fs.existsSync(schemaPath)) {
    schemaSqlContent = fs.readFileSync(schemaPath, "utf-8");
  }
} catch (err) {
  console.warn("Could not load schema.sql for dashboard view:", err.message);
}

// Interactive Web Console
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(renderInteractiveDashboard(schemaSqlContent));
});

// JSON Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "EduNovaAI Backend",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

// ============================================================================
// DATABASE CONNECTIVITY TEST (Credentials sanitized)
// ============================================================================
app.get("/api/test-supabase", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email")
      .limit(5);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Supabase connection check failed. Please ensure database tables are initialized."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supabase connection successful!",
      sampleUsers: data || []
    });
  } catch (error) {
    console.error("Supabase Test Error:", error);
    return res.status(500).json({
      success: false,
      message: "Supabase connection check failed."
    });
  }
});

// ============================================================================
// API ROUTES REGISTRATION
// ============================================================================
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/progress", studentRoutes);
app.use("/api/history", studentRoutes);
app.use("/api/materials", studentRoutes);
app.use("/api/material", studentRoutes);
app.use("/api/recommendations", studentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/analytics", analyticsRoutes);

// ============================================================================
// ERROR HANDLING (404 and Central Error Sanitizer)
// ============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// SERVER START & ENVIRONMENT INTEGRITY CHECK
// ============================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ======================================================
  🧠 EduNovaAI Backend Engine is Active!
  📡 Server URL:         http://localhost:${PORT}
  ⚡ Interactive Tester: http://localhost:${PORT}/
  📊 Health Check:       http://localhost:${PORT}/api/health
  🛡️ Security:          Helmet, Rate-Limiting, CORS, 1MB Body Limit
  🔐 Auth:              Argon2id + JWT + Student-Only
  🗄️ Database:          Supabase PostgreSQL
  ======================================================
  `);

  if (!process.env.JWT_SECRET) {
    console.error("⚠️  CRITICAL WARNING: JWT_SECRET is missing from .env!");
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error("⚠️  CRITICAL WARNING: Supabase credentials missing from .env!");
  }
});

export default app;
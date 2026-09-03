import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT Bearer token from Authorization header
 * Handles missing, malformed, invalid, and expired tokens with HTTP 401.
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication token is missing."
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Malformed authorization header. Expected format: Bearer <token>"
      });
    }

    const token = authHeader.split(" ")[1]?.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Bearer token payload is empty."
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ CRITICAL: JWT_SECRET is missing from environment variables.");
      return res.status(500).json({
        success: false,
        message: "Internal server configuration error."
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    
    // Attach decoded user payload to request
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Session expired. Please log in again."
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Invalid or corrupted token."
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed: Token verification failed."
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Enforces role restrictions on protected routes.
 * 
 * HTTP 401 -> Authentication failure (missing user/role identity)
 * HTTP 403 -> Authorization failure (insufficient role permissions)
 * 
 * @param {...string} allowedRoles Roles permitted (e.g. 'student', 'teacher', 'admin')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: No user identity found."
      });
    }

    const normalizedUserRole = req.user.role.toLowerCase().trim();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase().trim());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}] only. Your current role is '${req.user.role}'.`
      });
    }

    next();
  };
};

export default authMiddleware;
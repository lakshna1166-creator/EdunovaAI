/**
 * Global 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: [${req.method}] ${req.originalUrl}`
  });
};

/**
 * Global Error Handler Middleware
 * 
 * Secure centralized error handling that prevents leaking sensitive server internals:
 * - Sanitizes database/PostgreSQL/Supabase errors
 * - Sanitizes stack traces, credentials, and internal file paths
 * - Catches malformed JSON payloads (HTTP 400)
 * - Catches payload size limits (HTTP 413)
 * - Logs detailed error information to server console only
 */
export const errorHandler = (err, req, res, next) => {
  // Always log the full technical error details on the server side
  console.error("🔥 [Server Error Log]:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  // Handle malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload in request body. Please verify your syntax."
    });
  }

  // Handle request entity too large (payload limit exceeded)
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Payload too large. Request body exceeds the maximum allowed limit (1MB)."
    });
  }

  // Determine status code
  const statusCode = typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : typeof err.status === "number" && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  // Sanitize error message for client response
  let clientMessage = err.message || "An unexpected internal server error occurred.";

  // If it's a 500 internal server error or contains database/SQL keywords, mask it
  const isInternalOrDbError =
    statusCode === 500 ||
    /postgres|supabase|pgrst|relation|syntax error at|violates|column|table|select|insert|update|delete|secret|jwt/i.test(
      clientMessage
    );

  if (isInternalOrDbError) {
    clientMessage = "An internal database or server error occurred. Please try again later.";
  }

  const responsePayload = {
    success: false,
    message: clientMessage
  };

  // Only attach non-sensitive stack trace in explicit development environment
  if (process.env.NODE_ENV === "development" && !isInternalOrDbError) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

export default {
  notFoundHandler,
  errorHandler
};


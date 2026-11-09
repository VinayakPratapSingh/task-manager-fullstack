const allowedOrigin =
  process.env.CLIENT_URL || "http://localhost:5173";

export function verifyRequestOrigin(req, res, next) {
  const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];

  // No origin check is needed for read-only requests.
  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  const requestOrigin = req.get("Origin");

  // Allow requests without Origin for tools like Postman.
  if (!requestOrigin) {
    return next();
  }

  if (requestOrigin !== allowedOrigin) {
    return res.status(403).json({
      success: false,
      message: "Request blocked: untrusted origin",
    });
  }

  next();
}
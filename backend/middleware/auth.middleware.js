import jwt from "jsonwebtoken";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({
        message: "Auth required",
        correlationId: Date.now().toString(36),
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        message: "Invalid token format",
        correlationId: Date.now().toString(36),
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({
      message: "Auth required",
      error: error.message,
      correlationId: Date.now().toString(36),
    });
  }
};

const { verifyAccessToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Access token missing");
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};

module.exports = authMiddleware;
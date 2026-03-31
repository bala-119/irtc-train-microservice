const jwt = require("jsonwebtoken");

const checkProfileCompleted = async (req, res, next) => {
  try {
    //  1. Get token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token missing or invalid"
      });
    }

    const token = authHeader.split(" ")[1];

    //  2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    //  3. Use token as user
    const user = decoded;
    req.user = user;
    console.log(user);

    //  4. Verification checks
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified"
      });
    }

    if (!user.phone_verified) {
      return res.status(403).json({
        success: false,
        message: "Phone not verified"
      });
    }

    if (!user.aadhaarId_verified) {
      return res.status(403).json({
        success: false,
        message: "Aadhaar not verified"
      });
    }

    //  5. Required fields
    const requiredFields = [
      "fullName",
      "user_name",
      "email",
      "phone",
      "mpin",
      "role"
    ];

    const missingFields = requiredFields.filter(field => {
      const value = user[field];
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    });

    if (missingFields.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Complete your profile. Missing: ${missingFields.join(", ")}`
      });
    }

    //  All good
    console.log("moving to next(authMiddleware)....")
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid token"
    });
  }
};

module.exports = checkProfileCompleted;
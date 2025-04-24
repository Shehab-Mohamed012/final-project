const jwt = require("jsonwebtoken");
const User = require("../models/user"); 

const authMiddleware = async (req, res, next) => {
  try {
    // قراءة التوكن من الهيدر
    const token = req.header("Authorization")?.split(" ")[1]; // "Bearer TOKEN"
    if (!token) return res.status(401).json({ error: "Unauthorized. No token provided." });

    // فك التوكن
    const decoded = jwt.verify(token, "YOUR_SECRET_KEY");
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    req.user = user; // تمرير بيانات المستخدم إلى الطلب
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;

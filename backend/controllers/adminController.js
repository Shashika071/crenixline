import jwt from "jsonwebtoken";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

 
export const login = (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: "admin_id", role: "admin" },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "5h" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid credentials",
  });
};
 
export const protectedRoute = (req, res) => {
  res.json({
    success: true,
    message: "You accessed a protected route!",
    userId: req.body.userId,
  });
};

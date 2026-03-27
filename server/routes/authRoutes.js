const router = require("express").Router();
const { register, login, googleAuth, googleCallback, approveUser } = require("../controllers/authController");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const createRateLimiter = require("../middleware/rateLimiter");

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Try again later."
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.patch("/users/:id/approve", auth, roles("Admin"), approveUser);
router.get("/users", auth, roles("Admin"), asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const users = await User.find(filter).select("-password");
  res.json(users);
}));

module.exports = router;

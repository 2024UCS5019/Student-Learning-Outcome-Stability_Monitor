const router = require("express").Router();
const { register, login, googleAuth, googleCallback } = require("../controllers/authController");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

router.post("/register", register);
router.post("/login", login);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/users", asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const users = await User.find(filter).select("-password");
  res.json(users);
}));

module.exports = router;

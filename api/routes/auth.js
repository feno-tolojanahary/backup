
const router = require("express").Router();
const { verifyAccessToken } = require("../services/authService");
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout/:id", verifyAccessToken, authController.logout);

module.exports = router;
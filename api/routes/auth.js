
const router = require("express").Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

module.exports = router;
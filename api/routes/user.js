
const router = require("express").Router();
const { verifyAccessToken } = require("../services/authService");
const userController = require("./../controllers/userController");

router.post("/login", userController.login);
router.post("/logout", verifyAccessToken, userController.logout);

module.exports = router;
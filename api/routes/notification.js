const router = require("express").Router();
const notificationController = require("../controllers/notificationController");

router.route('/')
.get(notificationController.getNotifications);

module.exports = router;

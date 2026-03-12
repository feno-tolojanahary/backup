const router = require("express").Router();
const notificationController = require("../../controllers/notifications/notificationEventController");

router.route('/')
.get(notificationController.getNotifications);

module.exports = router;

const router = require("express").Router();
const source = require("./source");
const destination = require("./destination");
const notificationProvider = require("./notificationProvider");
const setting = require("./setting");
const job = require("./job");
const backup = require("./backup");

router.use("/source", source);
router.use("/destination", destination);
router.use("/notification-providers", notificationProvider);
router.use("/setting", setting);
router.use("/jobs", job);
router.use("/backups", backup);

module.exports = router;
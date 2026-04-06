const express = require("express");
const router = require("express").Router();
const source = require("./source");
const destination = require("./destination");
const notificationProvider = require("./notifications/notificationProvider");
const setting = require("./setting");
const job = require("./job");
const backup = require("./backup");
const notificationEvent = require("./notifications/notificationEvent");
const notificationRule = require('./notifications/notificationRule');
const auth = require("./auth");
const user = require("./user");
const stats = require("./stats");
const { tokenAccess } = require("../middlewares/auth");
const { config } = require("../../config");

router.use("/auth", auth); 
router.use("/users", user);
router.use("/profile", express.static(config.publicDirectory));
router.use(tokenAccess);
router.use("/sources", source);
router.use("/destinations", destination);
router.use("/notification-providers", notificationProvider);
router.use("/notification-events", notificationEvent);
router.use("/notification-rules", notificationRule);
router.use("/settings", setting);
router.use("/jobs", job);
router.use("/backups", backup);
router.use("/stats", stats)

module.exports = router;
const router = require("express").Router();
const source = require("./source");
const destination = require("./destination");
const notificationProvider = require("./notificationProvider");
const setting = require("./setting");

router.use("/source", source);
router.use("/destination", destination);
router.use("/notificat-provider", notificationProvider);
router.use("/setting", setting);

module.exports = router;
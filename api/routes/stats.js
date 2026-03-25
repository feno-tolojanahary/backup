const router = require("express").Router();
const statController = require("../controllers/statController");

router.get("/dashboard", statController.getStats);

module.exports = router;

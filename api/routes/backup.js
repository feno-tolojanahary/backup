
const router = require("express").Router();
const backupController = require("./../controllers/backupController");

router.route("/")
    .get(backupController.getList);

router.route("/:id")
    .delete(backupController.deleteBackup)    
    
router.post("/restore/:id", backupController.restoreBackup);

module.exports = router;

const router = require("express").Router();
const userController = require("./../controllers/userController");

router.post("/", userController.insert);
router.put("/:id", userController.updateById);

module.exports = router;

const router = require("express").Router();
const { upload } = require("../middlewares/upload");
const userController = require("./../controllers/userController");

router.post("/", userController.insert);
router.put("/:id", upload.single('avatar'), userController.updateById);
router.get("/:id", userController.getUser);

module.exports = router;
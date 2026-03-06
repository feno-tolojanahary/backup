const router = require("express").Router();
const settingController = require("../controllers/settingController");

router.route('/')
    .post(settingController.insert)
    .get(settingController.findAll);

router.route(':id')
    .put(settingController.update)

module.exports = router;

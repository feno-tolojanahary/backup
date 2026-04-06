const router = require("express").Router();
const settingController = require("../controllers/settingController");

router.route('/')
    .post(settingController.insert)
    .get(settingController.findAll);

router.put('/:id', settingController.update)

router.post('/multi-upsert', settingController.multiUpsert)

module.exports = router;

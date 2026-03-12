const router = require("express").Router();
const notificationProviderController = require("../controllers/notificationProviderController");

router.route('/')
    .post(notificationProviderController.insert)
    .get(notificationProviderController.getAll);

router.route(':id')
    .put(notificationProviderController.update)
    .delete(notificationProviderController.deleteById)
    .get(notificationProviderController.getById);

router.post("/save-rules", notificationProviderController.saveRules);
router.put("/update-rules", notificationProviderController.updateRules);

module.exports = router;

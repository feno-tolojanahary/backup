const router = require("express").Router();
const notificationProviderController = require("../../controllers/notifications/notificationProviderController");

router.route('/')
    .post(notificationProviderController.insert)
    .get(notificationProviderController.getAll);

router.route('/:id')
    .put(notificationProviderController.update)
    .delete(notificationProviderController.deleteById)
    .get(notificationProviderController.getById);

module.exports = router;

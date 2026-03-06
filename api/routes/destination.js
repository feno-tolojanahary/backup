
const router = require("express").Router();
const destinationController = require("../controllers/destinationController");

router.route('/')
    .post(destinationController.insert)
    .get(destinationController.find);

router.route(':id')
    .put(destinationController.update)
    .delete(destinationController.delete)
    .get(destinationController.findById)

module.exports = router;
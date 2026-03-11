const router = require("express").Router();
const sourceController = require("../controllers/sourceController");

router.route('/')
    .post(sourceController.insert)
    .get(sourceController.getList);

router.route(':id')
    .put(sourceController.update)
    .delete(sourceController.delete)
    .get(sourceController.findById)

router.post("/test-connection", sourceController.testConnection);

module.exports = router;
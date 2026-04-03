const router = require("express").Router();
const destinationController = require("../controllers/destinationController");
const {
    duplicateCheckCreate,
    duplicateCheckUpdate,
} = require("../middlewares/checkDuplicate");

const checkDuplicateDestinationCreate = duplicateCheckCreate(
    "destinations",
    "name"
);

const checkDuplicateDestinationUpdate = duplicateCheckUpdate(
    "destinations",
    "name"
);

router.route("/")
    .post(checkDuplicateDestinationCreate, destinationController.insert)
    .get(destinationController.find);

router.post("/test-connection", destinationController.testConnection);

router.route("/:id")
    .put(checkDuplicateDestinationUpdate, destinationController.update)
    .delete(destinationController.delete)
    .get(destinationController.findById);

module.exports = router;

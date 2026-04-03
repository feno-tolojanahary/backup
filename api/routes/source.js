const router = require("express").Router();
const sourceController = require("../controllers/sourceController");
const {
    duplicateCheckCreate,
    duplicateCheckUpdate,
} = require("../middlewares/checkDuplicate");

const checkDuplicateSourceCreate = duplicateCheckCreate(
    "sources",
    "name"
);

const checkDuplicateSourceUpdate = duplicateCheckUpdate(
    "sources",
    "name"
);

router.route("/")
    .post(checkDuplicateSourceCreate, sourceController.insert)
    .get(sourceController.getList);

router.post("/test-connection", sourceController.testConnection);

router.route("/:id")
    .put(checkDuplicateSourceUpdate, sourceController.update)
    .get(sourceController.findById)
    .delete(sourceController.delete);

module.exports = router;

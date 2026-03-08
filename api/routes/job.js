
const router = require("express").Router();
const jobController = require("../controllers/jobController");

router.route('/')
    .post(jobController.insert)
    .get(jobController.getAllJobs);

router.route(':id')
    .put(jobController.update)
    .delete(jobController.deleteJob)

module.exports = router;
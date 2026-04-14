
const router = require("express").Router();
const jobController = require("../controllers/jobController");
const {
    duplicateCheckCreate,
    duplicateCheckUpdate,
} = require("../middlewares/checkDuplicate");

const checkDuplicateJobCreate = duplicateCheckCreate(
    "jobs",
    "name"
);

const checkDuplicateJobUpdate = duplicateCheckUpdate(
    "jobs",
    "name"
);

router.route('/')
    .post(checkDuplicateJobCreate, jobController.insert)
    .get(jobController.getAllJobs);

router.route('/:id')
    .put(checkDuplicateJobUpdate, jobController.update)
    .delete(jobController.deleteJob)
    .get(jobController.getJobDetail)
    .post(jobController.runJobNow);

router.post("/:id/abort", jobController.abortJob);

router.get("/job-runs/:jobId", jobController.getJobRunList);

module.exports = router;

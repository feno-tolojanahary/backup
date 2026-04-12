const sourceService = require("../services/infrastructure/sourceService");
const targetService = require("../../lib/db/job/targetService");
const destinationService = require("../services/infrastructure/destinationService");
const response = require("../utils/response");
const jobService = require("../../lib/db/job/jobService");
const { runJob } = require("../../lib/handlers/jobs");

class JobController {
    constructor() {}

    async insert(req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            const { source: sourceId, destinations: destinationIds } = req.body;
            const createdBy = req.userId;
            // create target
            const source = await sourceService.findById(sourceId);
            const destinationFinds = destinationIds.map(async (destId) => destinationService.findById(destId));
            const destinations = await Promise.all(destinationFinds);
            const targetName = source.name + "_" + destinations.reduce((name, dest) =>  name + "-" + dest.name, "")
            const target = {
                name: targetName,
                type: req.body.type,
                source_id: sourceId,
                created_by: createdBy
            }
            const resTarget = await targetService.insert(target);
            if (!resTarget.lastId)
                throw new Error("Error when creating target: " + resTarget.errorMsg)
            
            // create target_destinations
            const targetDestinations = destinationIds.map((destination_id) => ({ target_id: resTarget.lastId, destination_id, created_by: createdBy }))
            const resDests = await targetService.insertTargetDestinations(targetDestinations);
            if (resDests.errorMsg)
                throw new Error("Error when creating target dest: " + resDests.errorMsg)
            // insert job
            const job = {
                ...req.body,
                createdBy: req.userId,
                targetId: resTarget.lastId,
                target: targetName,
                status: "running"
            }
            const result = await jobService.insert(job);
            if (!result.success)
                throw new Error("Error insert job: " + result.message)
            response.created(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            if (!req.params.id) 
                throw new Error("The id in params is required.");
            const job = await jobService.findJob({ id: req.params.id });
            if (req.body.source || req.body.destinations) {
                const targetUpdate = await targetService.update(job.target_id, req.body);
                if (targetUpdate.errorMsg) 
                    throw new Error("Error update target: " + targetUpdate.errorMsg)
            }
            const result = await jobService.update({id: req.params.id}, req.body);
            if (!result.success)
                throw new Error(result.message);
            response.success(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async getAllJobs(req, res, next) {
        try {
            let adminId = req.userId;
            if (!adminId)
                throw new Error("The admin id is required.");
            const data = await jobService.getListJobs({ userId: adminId });
            response.success(res, data);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async deleteJob(req, res, next) {
        try {
            if (!req.params.id) 
                throw new Error("The id in params is required.");
            const result = await jobService.deleteJob({ id: req.params.id })
            if (result.changes === 0) {
                response.notFound(res, "The precised job id is not found.");
                return;
            }
            if (!result.success)
                throw new Error(result.message);
            response.noContent(res);
        } catch (error) {
            console.log(error);
            next(error);
            response.error(res, error.message);
        }
    }

    async getJobDetail(req, res, next) {
        try {
            const jobId = req.params.id;
            if (!jobId) 
                throw new Error("The id in params is required.");
            const jobDetail = await jobService.getJobDetail(jobId);
            if (!result.ok)
                throw new Error(jobDetail.errorMsg);
            response.success(res, jobDetail);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async getJobList (req, res, next) {
        try {
            const jobList = await jobService.getJobList();
            response.success(res, jobList);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async runJobNow(req, res, next) {
        try {
            const jobId = req.params.id;
            if (!jobId) 
                throw new Error("The id in params is required.");
            await runJob(jobId);
            response.success(res, { success: true });
        } catch (error) {
            console.log(error);
            response.error(res, { success: false });
            next(error);
        }
    }

    async getJobRunList(req, res, next) {
        try {
            const jobId = req.params.jobId;
            if (!jobId) 
                throw new Error("The jobId in params is required.");
            const jobRuns = await jobService.getJobRuns({ jobId });
            response.success(res, jobRuns);
        } catch (error) {
            console.log(error);
            response.error(res, { success: false });
            next(error);
        }
    }
}

module.exports = new JobController();
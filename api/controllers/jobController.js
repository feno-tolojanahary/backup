const sourceService = require("../services/infrastructure/sourceService");
const targetService = require("../../lib/db/job/targetService");
const destinationService = require("../services/infrastructure/destinationService");
const response = require("../utils/response");
const jobService = require("../../lib/db/job/jobService");

class JobController {
    constructor() {}

    async insert(req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            const { source: sourceId, destinations: destinationIds, createdBy } = req.body;
            
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
                target_id: resTarget.lastId,
                target: targetName
            }
            const result = await jobService.insert(job);
            if (!result.success)
                throw new Error("Error inserting job.");
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
            let adminId = req.params.adminId;
            if (!adminId)
                throw new Error("The admin id is required.");
            const result = await jobService.listJob({ userId: adminId });
            if (!result.data)
                throw new Error(result.message);
            response.success(res, result.data);
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
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new JobController();
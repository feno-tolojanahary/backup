const { testConf } = require("../../lib/storages/storageHelper");
const sourceService = require("../services/infrastructure/sourceService");
const response = require("../utils/response");

class SourceController {
    constructor() {}

    async insert(req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            const result = await sourceService.insert(req.body);
            if (!result)
                throw new Error("Insertion error.");
            response.created(res, result)
            next();
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.");
            if (!req.params.id) 
                throw new Error("The id in params is required.");
            const updateData = req.body;
            if (updateData.config) {
                const existSource = await sourceService.findById(req.params.id);
                updateData.config = { ...(existSource.config ?? {}), ...updateData.config };
            }
            console.log("data: ", updateData)
            const result = await sourceService.update({ id: req.params.id }, updateData);
            if (!result)
                throw new Error("Update error.");
            response.success(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async findById(req, res, next) {
        try {
            const id = req.params.id;
            if (!id) 
                throw new Error("The id in params is required.");
            const result = await sourceService.findById(id);
            response.success(res, result)
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async getList(req, res, next) {
        try {
            const result = await sourceService.find();
            if (!result)
                throw new Error("Error when get service list.");
            response.success(res, result)
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const id = req.params.id;
            if (!id) 
                throw new Error("The id field in params is required");
            const result = await sourceService.deleteById(id)
            response.success(res, result)
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async testConnection(req, res, next) {
        try {
            const config = req.body;
            if (!config) {
                throw new Error("The params body is required.");
            }
            const srcRes = await testConf(config);
            console.log("test res: ", srcRes)
            response.success(res, srcRes);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new SourceController();
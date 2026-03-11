const destinationService = require("../services/infrastructure/destinationService");
const response = require("../utils/response");

class DestinationController {
    constructor() {}

    async insert(req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            const result = await destinationService.insert(req.body);
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
            const result = await destinationService.update({ id: req.params.id }, req.body);
            if (!result)
                throw new Error("Update error.");
            response.success(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async find(req, res, next) {
        try {
            const result = await destinationService.find();
            if (!result)
                throw new Error("Error when get service list.");
            response.success(res, result)
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
            const result = await destinationService.findById(id);
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
            const res = await destinationService.deleteById(id)
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
            response.success(res, srcRes);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new DestinationController();
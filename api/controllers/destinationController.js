const destinationService = require("../services/infrastructure/destinationService");
const response = require("../utils/response");
const { testConf } = require("./../../lib/storages/storageHelper");
const { decryptText } = require("../utils/cryptoKey");

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
            if (result === undefined || result === null)
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
            console.log("Error find destinations: ", error.message);
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
            const result = await destinationService.deleteById(id)
            response.success(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async testConnection(req, res, next) {
        try {
            let dest = req.body;
            if (!dest) {
                throw new Error("The params body is required.");
            }
            const config = { ...dest?.config, type: dest.type };
            if (config?.privateKeyEnc) {
                config.privateKey = decryptText(config.privateKeyEnc);
            }
            const srcRes = await testConf(config);
            const status = srcRes.connected ? "connected" : "disconnected";
            dest.status = status;
            dest.errorMsg = srcRes.errorMsg;
            await destinationService.update({ id: dest.id }, { status })  

            response.success(res, dest);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new DestinationController();

const destinationService = require("../services/infrastructure/destinationService");
const response = require("../utils/response");
const { testConf } = require("./../../lib/storages/storageHelper");

class DestinationController {
    constructor() {}

    sanitizeDestination(destination) {
        if (!destination) return destination;
        const config = destination.config && typeof destination.config === "object"
            ? { ...destination.config }
            : {};

        const hasPrivateKey = Boolean(config.privateKeyEnc);
        const fingerprint = config.privateKeyFingerprint;
        const updatedAt = config.privateKeyUpdatedAt;

        delete config.privateKey;
        delete config.privateKeyEnc;
        delete config.privateKeyFingerprint;
        delete config.privateKeyUpdatedAt;
        delete config.removePrivateKey;

        return {
            ...destination,
            config,
            hasPrivateKey,
            fingerprint,
            updatedAt,
        };
    }

    buildUpdatePayload(body = {}) {
        const nextBody = { ...body };

        if (nextBody.type !== "ssh") {
            delete nextBody.privateKey;
            delete nextBody.removePrivateKey;
            return nextBody;
        }

        nextBody.config = {
            ...(nextBody.config || {}),
        };

        if (typeof nextBody.privateKey === "string" && nextBody.privateKey.trim()) {
            nextBody.config.privateKey = nextBody.privateKey;
        }

        if (nextBody.removePrivateKey) {
            nextBody.config.removePrivateKey = true;
        }

        delete nextBody.privateKey;
        delete nextBody.removePrivateKey;

        return nextBody;
    }

    async insert(req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            const result = await destinationService.insert(this.buildUpdatePayload(req.body));
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
            const result = await destinationService.update(
                { id: req.params.id },
                this.buildUpdatePayload(req.body)
            );
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
            response.success(res, result.map((destination) => this.sanitizeDestination(destination)))
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
            response.success(res, this.sanitizeDestination(result))
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
            if (typeof dest.privateKey === "string" && dest.privateKey.trim()) {
                config.privateKey = dest.privateKey;
            }
            if (dest.type === "ssh" && config.authMethod === "key" && !config.privateKey) {
                if (dest.removePrivateKey) {
                    throw new Error("A replacement private key is required after removing the existing key.");
                }
                if (dest.id) {
                    const storedDestination = await destinationService.findById(dest.id);
                    if (storedDestination?.config?.privateKeyEnc) {
                        config.privateKeyEnc = storedDestination.config.privateKeyEnc;
                        if (!config.passphrase && storedDestination.config.passphrase) {
                            config.passphrase = storedDestination.config.passphrase;
                        }
                    }
                }
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

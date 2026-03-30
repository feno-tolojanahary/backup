const argon2 = require("argon2");
const userService = require("../services/userService");
const userLibService = require("../../lib/db/userService");
const response = require("../utils/response");

class UserController {
    constructor() {}

    async insert(req, res, next) {
        try {
            if (!req.body) {
                throw new Error("req.body is required.")
            }
            let user = req.body;
            
            const hashPassword = await argon2.hash(user.password, {
                type: argon2.argon2d,
                memoryCost: 2 ** 16,
                timeCost: 3,
                parallelism: 1
            });
            user.password = hashPassword;
            const result = await userService.insert(user);
            response.success(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async getUserByToken(req, res, next) {
        try {
            const token = req.body;
            if (!token) {
                throw new Error("The token in body is required");
            }
            const user = await userService.getUserProfile({ token });
            response.success(res, user);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async updateById(req, res, next) {
        try {
            const id = req.params.id;
            if (!id || !req.body)
                throw new Error("id is required in params and body is required");
            const updateRes = await userService.updateById(id, req.body);

            if (updateRes.changes === 0) {
                response.notFound(res, "User id not found");
                return;
            }
            if (req.file) {
                const user = await userLibService.adminUser();
                const dataFile = {
                    type: "profile",
                    filename: req.file.filename,
                    userId: user.id,
                    metadata: req.file
                }
                await userService.upsertUserFile(dataFile);
            }
            response.success(res, { ok: true, changes: updateRes.changes })
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async getUserCount(req, res, next) {
        try {
            const userCount = await userService.stmt.userCount.get();
            response.success(res, userCount.total);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new UserController();
const crypto = require("crypto");
const response = require("../utils/response");
const { stmts, buildAccessToken, EXPIRATION_TIME_MS } = require("../services/authService");
const argon2 = require("argon2");
const userService = require("../services/userService");
const { unlockVault } = require("../../lib/encryption/util");
const { generateVaultFile } = require("../../lib/encryption/cryptoTools");

class AuthController {
    constructor() {}

    async login(req, res, next) {
        try {
            if (!req.body)
                throw new Error("req.body is required.");
            const { email, password } = req.body;
            const user = stmts.findByEmail.get(email);
            if (!user || !(await argon2.verify(user.password, password))) {
                response.badRequest(res, "Invalid email or password.")
                return;
            }
            const roles = stmts.findPermissions.all(user.id);
            const permissions = stmts.findRoles.all(user.id);

            const accessToken = await buildAccessToken(user, permissions, roles);
            const refreshToken = crypto.randomBytes(64).toString("hex");
            const expirationTime = (Date.now() + EXPIRATION_TIME_MS) / 1000;
            stmts.setRefreshToken.run(refreshToken, expirationTime, user.id);

            const userInfo = await userService.getUserProfile({ id: user.id });

            if (!(await unlockVault(password))) {
                throw new Error("Unable to unlock vault.")
            }
            
            response.success(res, {
                refreshToken,
                accessToken,
                user: userInfo,
                roles,
                permissions
            })
        } catch(error) {
            console.log("Error login: ", error.message);
            response.error(res, error.message);
            next(error);
        }
    }

    async refreshToken(req, res, next) {
        try {
            const token = req.body.refreshToken;
            if (!token) {
                throw new Error("No refresh token available");
            }
            const user = stmts.findByRefreshToken.get(token);
            if (!user) {
                response.badRequest(res, "Invalid refresh token.");
                return;
            }
            if (user.expires_at < (Date.now()/1000)) {
                response.badRequest(res, "Refresh token expired.");
                return;
            }
            const roles = stmts.findPermissions.all(user.id);
            const permissions = stmts.findRoles.all(user.id);

            const accessToken = await buildAccessToken(user, permissions, roles);
            const refreshToken = crypto.randomBytes(64).toString("hex");
            stmts.setRefreshToken.run(refreshToken, (Date.now() + EXPIRATION_TIME_MS) / 1000, user.id);

            const userInfo = await userService.getUserProfile({ id: user.id });

            response.success(res, {
                accessToken,
                refreshToken,
                user: userInfo,
                roles,
                permissions
            })
        } catch(error) {    
            console.log("Error refresh token: ", error.message);
            response.error(res, error.message);
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const { token } = req.body;
            if (!token)
                throw new Error("The refresh token as a body is required.");
            const user = stmts.findByRefreshToken.get(token);
            if (user)
                stmts.clearRefreshToken.run(user.id);
            response.success(res, { ok: true });
        } catch (error) {
            console.log("Error logout: ", error.message);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new AuthController();      
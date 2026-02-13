const db = require("./connection");

class UserService {
    constructor() {} 
    
    async adminUser () {
        const user = db.prepare(`SELECT * FROM users LIMIT 1`).get();
        return user;
    }
}

module.exports = new UserService();
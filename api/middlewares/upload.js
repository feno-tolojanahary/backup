const multer = require("multer");
const { config } = require("./../../config");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.publicDirectory)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = new Date().toISOString().replace(/[:-]/g, '').replace(/\..+/, '');
        cb(null, file.filename + "-" + uniqueSuffix);
    }
})

const upload = multer({ storage });

module.exports = {
    upload
}
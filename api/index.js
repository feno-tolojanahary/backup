const express = require("express");
require("dotenv");

const app = express();
const route = require("./routes/index");

const port = process.env.PORT || 3030;

app.use(express.json());

app.use(route);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const route = require("./routes/index");

const port = process.env.PORT || 3030;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }  
  next();
});

app.use(cookieParser());

app.use(express.json());

app.use(route);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

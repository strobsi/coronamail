var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var multer = require("multer");
var upload = multer();
var striptags = require("striptags");
const expressSanitizer = require("express-sanitizer");
const redis = require("redis");
require("dotenv").config();
const client = redis.createClient({
  port: 6379,
  host: "redis",
  password: process.env.REDIS_PASSWORD,
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "200kb", type: "application/json" }));
app.use(upload.array());
app.use(expressSanitizer());
app.use(express.static("public"));

app.post("/send", function (req, res) {
  console.log("received");
  var e = striptags(req.sanitize(req.body.email));
  var m = striptags(req.sanitize(req.body.message));
  const now = Math.floor(new Date() / 1000);
  var store = {
    from: e,
    msg: m,
    date: now,
  };
  client.rpush("mailer", JSON.stringify(store));
  res.send(JSON.stringify(store));
});

app.listen(process.env.PORT, function () {
  console.log("Server running...");
});

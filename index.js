var express = require("express");
var app = express();
require("dotenv").config();
var bodyParser = require("body-parser");
var multer = require("multer");
var upload = multer();
var striptags = require("striptags");
const expressSanitizer = require("express-sanitizer");
const redis = require("redis");
const crypto = require("crypto");
const key = process.env.ENCRYPTION_KEY;

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

function encrypt(plainText) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let cipherText;
  try {
    cipherText = cipher.update(plainText, "utf8", "hex");
    cipherText += cipher.final("hex");
    cipherText = iv.toString("hex") + cipherText;
  } catch (e) {
    cipherText = null;
  }
  return cipherText;
}
// function decrypt(text) {
//   let iv = Buffer.from(text.iv, "hex");
//   let encryptedText = Buffer.from(text.e, "hex");
//   let decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
//   let decrypted = decipher.update(encryptedText);
//   decrypted = Buffer.concat([decrypted, decipher.final()]);
//   return decrypted.toString();
// }

app.post("/send", function (req, res) {
  console.log("received");
  var e = striptags(req.sanitize(req.body.email));
  var m = striptags(req.sanitize(req.body.message));
  var mailDate = striptags(req.sanitize(req.body.mailDate));
  const now = Math.floor(new Date() / 1000);
  var store = {
    from: e,
    msg: m,
    mailDate: mailDate,
    date: now,
  };
  var encrypted = encrypt(JSON.stringify(store));
  client.rpush("mailer", encrypted);
  res.send(JSON.stringify(store));
});

app.listen(process.env.PORT, function () {
  console.log("Server running...");
});

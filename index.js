var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var multer = require("multer");
var upload = multer();
var striptags = require("striptags");
const expressSanitizer = require("express-sanitizer");
var nodemailer = require("nodemailer");
var cors = require("cors");

require("dotenv").config();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.use(expressSanitizer());

var transporter = nodemailer.createTransport({
  host: "mail.codebrew.de",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: "branddnamailer@codebrew.de",
    pass: process.env.MAIL_PWD,
  },
});

app.use(express.static("public"));

app.post("/send", function (req, res) {
  console.log("received");
  var e = striptags(req.sanitize(req.body.email));
  var m = striptags(req.sanitize(req.body.message));
});

// function sendMail(n, e, m, res) {
//   text =
//     "Hallo brand.DNA Team<br>,hier ist eine neue Nachricht von der brand.DNA Website:";
//   text += "<br>";
//   text += "Name:" + n + "<br>";
//   text += "Email: " + e + "<br>";
//   text += "Nachricht: ";
//   text += "<br>-------------------------<br>";
//   text += m;
//   text += "<br>-------------------------<br>";
//   text += "Mit freundlichen Grüßen<br>Euer brand.DNA MailServer";

//   var mailOptions = {
//     from: "branddnamailer@codebrew.de",
//     to: "info@codebrew.de",
//     subject: "brand.DNA Contact form",
//     html: text,
//   };

//   transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//       console.log(error);
//       res.send(400);
//     } else {
//       res.sendStatus(200);
//     }
//   });
// }

app.listen(process.env.PORT, function () {
  console.log("Node mailer listening now");
});

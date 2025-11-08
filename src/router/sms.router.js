const express = require("express");
const router = express.Router();
const {
  sendSMS
} = require("../utils/smsService");

router.post("/send", sendSMS)
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/connectDatabase");
const userRoutes = require("./router/user.router");
const notif = require("./utils/notifyAdmin");
// const eskiz = require("./utils/smsService")

// console.log(eskiz.loginEskiz());

// console.log(eskiz.sendSMS("+998770057891","Это тест от Eskiz"))


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

// 🔹 Routes
app.use("/clients", userRoutes);
// app.use("/sms", require("./router/sms.router"));    

// 🔹 Eslatma ishga tushirish
notif.notifyAdminIfOilChangeDue();

const PORT = process.env.PORT || 7766;
app.listen(PORT, () =>
  console.log(`🚀 Server ishlayapti: http://localhost:${PORT}`)
);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/connectDatabase");
const userRoutes = require("./router/user.router");
const notifyAdminIfOilChangeDue = require("./utils/notifyAdmin");
const eskiz = require("./utils/smsService")

// console.log(eskiz.loginEskiz());

// console.log(eskiz.sendSMS("998770057891","salom"))


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://oilprojects.netlify.app" }));

connectDB();

// 🔹 Routes
app.use("/clients", userRoutes);

// 🔹 Eslatma ishga tushirish
notifyAdminIfOilChangeDue();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 Server ishlayapti: http://localhost:${PORT}`)
);

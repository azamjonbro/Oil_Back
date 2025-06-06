const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const app = express();

app.use(express.json());
app.use(cors({origin:"https://oilprojects.netlify.app"}));

// 💾 MongoDB ulash (MongoDB Atlas yoki Local)
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB xatosi:"));
db.once("open", () => console.log("MongoDB ulandi ✅"));

// 📦 Mijoz modeli (bitta schema)
const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    carNumber: { type: String, required: true },
    carBrand: { type: String, required: true },
    klameter: { type: String, required: true },
    oilBrand: { type: String, required: true },
    filledAt: { type: Date, required: true },
    nextChangeAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const Client = mongoose.model("Client", clientSchema);

// 📌 ROUTES — Controller + Router bitta joyda

// ➕ Yangi mijoz qo‘shish
app.post("/clients", async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📥 Barcha mijozlar
app.get("/clients", async (req, res) => {
  const clients = await Client.find();
  res.json(clients);
});

// 📄 Bitta mijoz
app.get("/clients/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Topilmadi" });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Mijozni tahrirlash
app.put("/clients/:id", async (req, res) => {
  try {
    const updated = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Topilmadi" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ❌ Mijozni o‘chirish
app.delete("/clients/:id", async (req, res) => {
  try {
    const deleted = await Client.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Topilmadi" });
    res.json({ message: "O‘chirildi ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let ADMIN_CHAT_ID = 2043384301;
async function notifyAdminIfOilChangeDue() {
  let today = new Date();

  console.log(today);

  const dueUsers = await Client.find({
    nextChangeAt: { $lte: today },
  });

  if (dueUsers.length === 0) {
    console.log("Bugun moy almashtiradigan mashina yo‘q.");
    return;
  }

  for (const user of dueUsers) {
    const message = `
🚗 Mashina: ${user.carBrand} / ${user.carNumber}
🛢 Moy markasi: ${user.oilBrand}
👤 Egasi: ${user.name}
📱 Tel: ${user.phone}
📆 Quyilgan sanasi: ${user.filledAt}
📆 Alishtirish sanasi: ${user.nextChangeAt} 
📏 Kilometer : ${user.klameter}
📆 Bugun moy almashtirish sanasi keldi!
    `.trim();

    try {
      await bot.sendMessage(ADMIN_CHAT_ID, message);
      console.log(`✅ Adminga yuborildi: ${user.name}`);
    } catch (err) {
      console.error("❌ Telegram xatoligi:", err.message);
    }
  }
}
notifyAdminIfOilChangeDue();

const cron = require("node-cron");

cron.schedule("0 9 * * *", () => {
  notifyAdminIfOilChangeDue();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server ishga tushdi: http://localhost:${PORT}`)
);

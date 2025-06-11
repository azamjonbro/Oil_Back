const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

app.use(express.json());
app.use(cors({
  origin:"https://oilprojects.netlify.app"
}));

// ✅ MongoDB ulanishi
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB xatosi:"));
db.once("open", () => console.log("MongoDB ulandi ✅"));

// 📦 Client Schema
const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    carNumber: { type: String, required: true },
    carBrand: { type: String, required: true },

    history: [
      {
        klameter: { type: String, required: true },
        oilBrand: { type: String, required: true },
        filledAt: { type: Date, required: true },
        nextChangeAt: { type: Date, required: true },
        price: { type: Number, required: true },
        oilFilter: { type: String, required: true },
        airFilter: { type: String, required: true },
        cabinFilter: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        notificationDate: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

const Client = mongoose.model("Client", clientSchema);

// ➕ Client qo‘shish yoki `history`ga qo‘shish
app.post("/clients", async (req, res) => {
  const {
    name,
    phone,
    carNumber,
    carBrand,
    klameter,
    oilBrand,
    filledAt,
    nextChangeAt,
    price,
    oilFilter,
    airFilter,
    cabinFilter,
  } = req.body;

  try {
    let client = await Client.findOne({ name, carNumber });

    const historyItem = {
      klameter,
      oilBrand,
      filledAt,
      nextChangeAt,
      price,
      oilFilter,
      airFilter,
      cabinFilter,
    };

    if (client) {
      client.history.push(historyItem);
      await client.save();
      return res.status(200).json(client);
    } else {
      client = new Client({
        name,
        phone,
        carNumber,
        carBrand,
        history: [historyItem],
      });
      await client.save();
      return res.status(201).json(client);
    }
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

// 🕓 Tarix (history) faqat
app.get("/clients/:id/history", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Topilmadi" });
    res.json(client.history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Mijozga yangi xizmat (update → history qo‘shish)
app.put("/clients/:id", async (req, res) => {
  console.log(req.body);

  const {
    filledAt,
    nextChangeAt,
    price,
    klameter,
    oilBrand,
    notificationDate,
    oilFilter,
    airFilter,
    cabinFilter,
  } = req.body;

  const historyItem = {
    filledAt,
    nextChangeAt,
    price,
    notificationDate,
    oilFilter,
    airFilter,
    cabinFilter,
    klameter,
    oilBrand,
  };

  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Topilmadi" });
    if (!client.history) {
      client.history = [];
    }
    client.history.push(historyItem);
    await client.save();
    res.json(client);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ❌ O‘chirish
app.delete("/clients/:id", async (req, res) => {
  try {
    const deleted = await Client.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Topilmadi" });
    res.json({ message: "O‘chirildi ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let ADMIN_CHAT_ID = 231199271;

async function notifyAdminIfOilChangeDue() {
  const today = new Date();

  const allClients = await Client.find();

  const dueUsers = allClients.filter((client) => {
    const history = client.history;
    if (!history || history.length === 0) return false;

    const latest = history[history.length - 1];
    return latest.notificationDate && latest.notificationDate <= today;
  });

  if (dueUsers.length === 0) {
    console.log("Bugun moy almashtiradigan mashina yo‘q.");
    return;
  }

  for (const user of dueUsers) {
    const message = `
🆔 ID: ${user._id}
🚗 Mashina: ${user.carBrand} / ${user.carNumber}
🛢 Moy markasi: ${user.history[user.history.length-1].oilBrand}
👤 Egasi: ${user.name}
📱 Tel: ${user.phone}
📆 Quyilgan sanasi: ${user.history[user.history.length-1].filledAt?.toLocaleDateString?.()}
📆 Alishtirish sanasi: ${user.history[user.history.length-1].nextChangeAt?.toLocaleDateString?.()}
📏 Kilometer: ${user.history[user.history.length-1].klameter}
📆 Bugun moy almashtirish sanasi keldi!
    `.trim();

    try {
      await bot.sendMessage(ADMIN_CHAT_ID, message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📥 Yuklash",
                callback_data: `load_${user._id}`, // bu callback orqali siz serverda ishlov berishingiz mumkin
              },
            ],
          ],
        },
      });

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

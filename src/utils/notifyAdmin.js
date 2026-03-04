const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user.model");
const cron = require("node-cron");
// const { sendSMS } = require("./smsService");
const bot = new TelegramBot("8008874583:AAEgo4-EgI3Eg-QvXngYZI4qXC6Yxc_YgMQ", { polling: false });
// const ADMIN_CHAT_ID = 231199271;
const ADMIN_CHAT_ID = 2043384301;


function formatDate(date) {
    if (!date) return "-";
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${d.getFullYear()}`;
}

async function notifyAdminIfOilChangeDue() {
  const today = new Date();
  const allUsers = await User.find();

  for (const user of allUsers) {
    const latestIndex = user.history?.length - 1;
    if (latestIndex < 0) continue;

    const latest = user.history[latestIndex];
    if (!latest?.notificationDate) continue;

    const notifDate = new Date(latest.notificationDate);

    const isToday =
      notifDate.toISOString().slice(0, 10) ===
      today.toISOString().slice(0, 10);

    if (isToday && latest.notified !== true) {
      const message = `
🚗 ${user.carBrand} / ${user.carNumber}
🛢 Moy: ${latest.oilBrand}
📆 Almashtirish sanasi: ${formatDate(latest.nextChangeAt)}

Hurmatli ${user.name},
Bugun moy almashtirish sanasi keldi.
Iltimos servisga murojaat qiling.
      `.trim();

      try {
        // 🔥 AGAR USERDA CHAT ID BO‘LSA
        if (user.chatId) {
          await bot.sendMessage(user.chatId, message);
          console.log(`✅ Userga yuborildi: ${user.name}`);
        } 
        // 🔥 AKS HOLDA ADMINGA
        else {
          await bot.sendMessage(ADMIN_CHAT_ID, `
❗ Userda chatId yo‘q

👤 ${user.name}
📱 ${user.phone}

${message}
          `.trim());

          console.log(`📨 Adminga yuborildi (chatId yo‘q): ${user.name}`);
        }

        // 🔥 YUBORILGANDAN KEYIN TRUE QILAMIZ
        user.history[latestIndex].notified = true;
        user.markModified("history");
        await user.save();

      } catch (err) {
        console.error(`❌ ${user.name} uchun xato:`, err.message);
      }
    }
  }

  console.log("✅ Tekshiruv tugadi");
}


cron.schedule("0 9 * * *", notifyAdminIfOilChangeDue);

module.exports = notifyAdminIfOilChangeDue;




async function resendFromFebruary() {
  const fromDate = new Date("2026-02-01");
  const today = new Date();

  const users = await User.find({
    history: {
      $elemMatch: {
        notificationDate: { $gte: fromDate, $lte: today },
      },
    },
  });

  console.log("Topilgan userlar:", users.length);

  for (const user of users) {

    const matchedHistories = user.history.filter(
      (h) =>
        h.notificationDate &&
        new Date(h.notificationDate) >= fromDate &&
        new Date(h.notificationDate) <= today
    );

    for (const history of matchedHistories) {

      const message = `
🆔 ID: ${user._id}
🚗 Mashina: ${user.carBrand} / ${user.carNumber}
🛢 Moy markasi: ${history.oilBrand}
👤 Egasi: ${user.name}
📱 Tel: ${user.phone}
📆 Quyilgan sanasi: ${formatDate(history.filledAt)}
📆 Alishtirish sanasi: ${formatDate(history.nextChangeAt)}
📏 Kilometer: ${history.klameter}
📆 Bildirishnoma sanasi: ${formatDate(history.notificationDate)}
🔁 QAYTA YUBORILDI (1-fevraldan bugungacha)
`.trim();

      try {
        await bot.sendMessage(ADMIN_CHAT_ID, message);
        console.log("Yuborildi:", user.name);
      } catch (err) {
        console.error("Xato:", err.message);
      }
    }
  }

  console.log("✅ Qayta yuborish tugadi");
}


// resendFromFebruary()


async function fixNotifications() {
  const today = new Date();

  const users = await User.find();

  for (const user of users) {
    let changed = false;

    for (let i = 0; i < user.history.length; i++) {
      const history = user.history[i];

      if (!history.notificationDate) {
        // notificationDate yo‘q bo‘lsa false qilamiz
        if (history.notified !== false) {
          user.history[i].notified = false;
          changed = true;
        }
        continue;
      }

      const notifDate = new Date(history.notificationDate);

      if (notifDate <= today) {
        // Vaqti kelgan → true
        if (history.notified !== true) {
          user.history[i].notified = true;
          changed = true;
        }
      } else {
        // Vaqti kelmagan → false
        if (history.notified !== false) {
          user.history[i].notified = false;
          changed = true;
        }
      }
    }

    if (changed) {
      user.markModified("history");
      await user.save();
      console.log("Yangilandi:", user.name);
    }
  }

  console.log("✅ Hammasi to‘g‘rilandi");
}


fixNotifications()
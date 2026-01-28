const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user.model");
const cron = require("node-cron");
const { sendSMS } = require("./smsService");
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
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

  const dueUsers = allUsers.filter((u) => {
    const latest = u.history?.at(-1);
    if (!latest?.notificationDate) return false;

    const notifDate = new Date(latest.notificationDate);
    return notifDate.toDateString() === today.toDateString();
  });
  for (const user of dueUsers) {
    const latest = user.history.at(-1);

    const message = `
🆔 ID: ${user._id}
🚗 Mashina: ${user.carBrand} / ${user.carNumber}
🛢 Moy markasi: ${latest.oilBrand}
👤 Egasi: ${user.name}
📱 Tel: ${user.phone}
📆 Quyilgan sanasi: ${formatDate(latest.filledAt)}
📆 Alishtirish sanasi: ${formatDate(latest.nextChangeAt)}
📏 Kilometer: ${latest.klameter}
📆 Bildirishnoma sanasi: ${formatDate(latest.notificationDate)}
📆 Bugun moy almashtirish sanasi keldi!
    `.trim();

    try {
      // 🔹 Adminga yuboramiz
      await bot.sendMessage(ADMIN_CHAT_ID, message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📥 Yuklash",
                callback_data: `load_${user._id}`,
              },
            ],
          ],
        },
      });

      console.log(`✅ Adminga yuborildi: ${user.name}`);

      // 🔹 Agar foydalanuvchiga SMS yuborish funksiyasi bo‘lsa:
      // const smsText = `Hurmatli ${user.name}, bugun moy almashtirish sanasi keldi. Iltimos, servisga murojaat qiling.`;
      await sendSMS(user.phone, message);

    } catch (err) {
      console.error(`❌ ${user.name} uchun yuborishda xato:`, err.message);
    }
  }

  console.log(`✅ ${dueUsers.length} ta foydalanuvchiga eslatma yuborildi`);
}


cron.schedule("0 9 * * *", notifyAdminIfOilChangeDue);

module.exports = notifyAdminIfOilChangeDue;

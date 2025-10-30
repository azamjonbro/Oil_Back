const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user.model");
const cron = require("node-cron");
const { sendSMS } = require("./smsService");
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const ADMIN_CHAT_ID = 231199271;

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
    const latest = u.history.at(-1);
    if (!latest?.notificationDate) return false;
    const notifDate = new Date(latest.notificationDate);
    return notifDate.toDateString() === today.toDateString();
  });

  for (const user of dueUsers) {
    const latest = user.history.at(-1);
    const message = `
🚗 ${user.carBrand} / ${user.carNumber}
👤 ${user.name} (${user.phone})
🛢 ${latest.oilBrand}
📅 ${formatDate(latest.nextChangeAt)}
📏 ${latest.klameter}
⚠️ Bugun moy almashtirish sanasi keldi.
`;
await sendSMS(user.phone, smsText);
    await bot.sendMessage(ADMIN_CHAT_ID, message);
  }

  console.log(`✅ ${dueUsers.length} ta foydalanuvchiga eslatma yuborildi`);
}

cron.schedule("0 9 * * *", notifyAdminIfOilChangeDue);

module.exports = notifyAdminIfOilChangeDue;

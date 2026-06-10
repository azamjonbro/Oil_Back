const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user.model");
const cron = require("node-cron");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const ADMIN_CHAT_ID = Number(process.env.ADMIN_ID) || 231199271;

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────
function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    d.getFullYear(),
  ].join("-");
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─────────────────────────────────────────
//  CRON — har kuni soat 9:00 da
//  Bugun notification sanasi kelgan userlarni tekshiradi
// ─────────────────────────────────────────
async function notifyAdminIfOilChangeDue() {
  console.log("🔔 Cron ishga tushdi:", new Date().toISOString());

  const todayStr = new Date().toISOString().slice(0, 10);
  const users = await User.find();

  let sentCount = 0;

  for (const user of users) {
    const lastIndex = (user.history?.length ?? 0) - 1;
    if (lastIndex < 0) continue;

    const latest = user.history[lastIndex];
    if (!latest?.notificationDate) continue;

    const notifStr = new Date(latest.notificationDate).toISOString().slice(0, 10);

    if (notifStr !== todayStr) continue;
    if (latest.notified === true) continue;

    const text =
      `🔔 *Bugun moy almashtirish sanasi!*\n\n` +
      `🆔 ID: \`${user._id}\`\n` +
      `👤 Egasi: ${user.name}\n` +
      `📱 Tel: ${user.phone}\n` +
      `🚗 Mashina: ${user.carBrand} / ${user.carNumber}\n` +
      `🛢 Moy markasi: ${latest.oilBrand ?? "—"}\n` +
      `📏 Kilometr: ${latest.klameter ?? "—"} km\n` +
      `📅 Quyilgan: ${formatDate(latest.filledAt)}\n` +
      `📅 Alishtirish: ${formatDate(latest.nextChangeAt)}\n` +
      `📆 Bildirishnoma: ${formatDate(latest.notificationDate)}`;

    try {
      if (user.chatId) {
        // Userga to'g'ridan-to'g'ri yuborish
        await bot.sendMessage(user.chatId, text, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📋 Batafsil", callback_data: `load_${user._id}` }],
            ],
          },
        });
        console.log(`✅ Userga yuborildi: ${user.name}`);
      } else {
        // chatId yo'q — adminga yuborish
        await bot.sendMessage(
          ADMIN_CHAT_ID,
          `⚠️ *chatId yo'q* — faqat adminga yuborildi\n\n${text}`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "📋 Batafsil", callback_data: `load_${user._id}` }],
              ],
            },
          }
        );
        console.log(`📨 Adminga yuborildi (chatId yo'q): ${user.name}`);
      }

      // notified = true deb belgilash
      user.history[lastIndex].notified = true;
      user.markModified("history");
      await user.save();
      sentCount++;

    } catch (err) {
      console.error(`❌ ${user.name} uchun xato:`, err.message);
    }
  }

  console.log(`✅ Cron tugadi. Yuborildi: ${sentCount} ta`);
}

// ─────────────────────────────────────────
//  ROUTE HANDLER — POST /clients/notify-admin
//  Admin calendar dan sana tanlaganda chaqiriladi
//  Body: { fromDate: "YYYY-MM-DD", toDate: "YYYY-MM-DD" }
// ─────────────────────────────────────────
async function notifyPostAdminIfSelectDate(req, res) {
  try {
    const { fromDate, toDate } = req.body;

    // Validatsiya
    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: "fromDate va toDate majburiy",
      });
    }

    const start = new Date(fromDate);
    const end   = new Date(toDate);
    end.setHours(23, 59, 59, 999); // toDate ni to'liq kun qilish

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        error: "Noto'g'ri sana formati. YYYY-MM-DD bo'lishi kerak",
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: "fromDate toDate dan katta bo'lmasligi kerak",
      });
    }

    console.log(`📅 Range: ${fromDate} → ${toDate}`);

    // Shu oraliqda notificationDate bo'lgan userlarni topish
    const users = await User.find({
      "history.notificationDate": { $gte: start, $lte: end },
    });

    console.log(`👥 Topilgan userlar: ${users.length}`);

    // Yuborish uchun xabarlarni yig'ish
    const messages = [];

    for (const user of users) {
      const matched = user.history.filter((h) => {
        if (!h.notificationDate) return false;
        const d = new Date(h.notificationDate);
        return d >= start && d <= end;
      });

      for (const history of matched) {
        messages.push({
          userId: user._id,
          text:
            `📋 *Moy almashtirish eslatmasi*\n\n` +
            `🆔 ID: \`${user._id}\`\n` +
            `👤 Egasi: ${user.name}\n` +
            `📱 Tel: ${user.phone}\n` +
            `🚗 Mashina: ${user.carBrand} / ${user.carNumber}\n` +
            `🛢 Moy markasi: ${history.oilBrand ?? "—"}\n` +
            `📏 Kilometr: ${history.klameter ?? "—"} km\n` +
            `📅 Quyilgan: ${formatDate(history.filledAt)}\n` +
            `📅 Alishtirish: ${formatDate(history.nextChangeAt)}\n` +
            `📆 Bildirishnoma: ${formatDate(history.notificationDate)}\n` +
            `📨 Holati: ${history.notified ? "✅ yuborilgan" : "⏳ yuborilmagan"}`,
        });
      }
    }

    console.log(`📨 Yuboriladigan xabarlar: ${messages.length}`);

    if (messages.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: "Bu oraliqda hech qanday notification topilmadi",
      });
    }

    // Ketma-ket yuborish (har 500ms da — Telegram rate limit)
    let successCount = 0;
    for (const msg of messages) {
      try {
        await bot.sendMessage(ADMIN_CHAT_ID, msg.text, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📋 Batafsil", callback_data: `load_${msg.userId}` }],
            ],
          },
        });
        successCount++;
      } catch (err) {
        console.error(`❌ Xabar yuborishda xato (${msg.userId}):`, err.message);
      }

      await delay(500);
    }

    console.log(`✅ Yuborildi: ${successCount}/${messages.length}`);

    return res.json({
      success: true,
      count: successCount,
      total: messages.length,
    });

  } catch (err) {
    console.error("❌ notifyPostAdminIfSelectDate error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

// ─────────────────────────────────────────
//  CRON SCHEDULE — har kuni soat 09:00
// ─────────────────────────────────────────
cron.schedule("0 9 * * *", notifyAdminIfOilChangeDue);

module.exports = {
  notifyAdminIfOilChangeDue,
  notifyPostAdminIfSelectDate,
};
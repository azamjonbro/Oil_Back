const axios = require("axios");
require("dotenv").config();

let accessToken = null;

// 🔹 Eskiz bilan login qilish
async function loginEskiz() {
  try {
    const res = await axios.post("https://my.eskiz.uz/api/auth/login", {
      email: process.env.ESKIZ_EMAIL,
      password: process.env.ESKIZ_PASSWORD,
    });
    accessToken = res.data.access_token;
    console.log("✅ Eskiz token olindi");
  } catch (err) {
    console.error("❌ Eskiz login xatosi:", err.response?.data || err.message);
  }
}

// 🔹 SMS yuborish funksiyasi
async function sendSMS(phone, message) {
  try {
    if (!accessToken) await loginEskiz();

    const res = await axios.get(
      "https://my.eskiz.uz/api/message/sms/send",
      {
        mobile_phone: phone.replace(/\D/g, ""), // faqat raqamlar
        message: message,
        from: "4546", // Eskizdan berilgan "sender name" yoki 4546
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`📩 SMS yuborildi: ${phone}`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) {
      await loginEskiz();
      return sendSMS(phone, message);
    }
    console.error("❌ SMS yuborishda xato:", err.response?.data || err.message);
  }
}

module.exports = { sendSMS,loginEskiz };

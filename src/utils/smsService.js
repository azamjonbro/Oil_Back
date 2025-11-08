const axios = require("axios");
require("dotenv").config();

let accessToken = null;

// 🔹 Eskiz bilan login qilish
async function loginEskiz() {
  try {
    const res = await axios.post("https://notify.eskiz.uz/api/auth/login", {
      email: process.env.ESKIZ_EMAIL,
      password: process.env.ESKIZ_PASSWORD,
    });
    accessToken = res.data.data.token;
    console.log(res);
    
    console.log("✅ Eskiz token olindi");
  } catch (err) {
    console.error("❌ Eskiz login xatosi:", err.response?.data || err.message);
  }
}

// 🔹 SMS yuborish funksiyasi
async function sendSMS(req, res) {
  try {
    if (!accessToken) await loginEskiz();

    const { mobile_phone, message } = req.body;

    const response = await axios.post(
      "https://notify.eskiz.uz/api/message/sms/send",
      {
        mobile_phone: mobile_phone.replace(/\D/g, ""),
        message: message,
        from: "4546", // Eskizdan berilgan "sender name" yoki 4546
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`📩 SMS yuborildi: ${mobile_phone}`);
    
    return res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    if (err.response?.status === 401) {
      await loginEskiz();
      return sendSMS(mobile_phone, message);
    }
    console.error("❌ SMS yuborishda xato:", err.response?.data || err.message);
  }
}

module.exports = { sendSMS,loginEskiz };

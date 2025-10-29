const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB ulandi");
  } catch (err) {
    console.error("❌ MongoDB xatosi:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

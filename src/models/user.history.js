const mongoose = require("mongoose");

const userHistorySchema = new mongoose.Schema({
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
  cost: { type: Number, default: 0 },
  master: { type: String, default: "Asosiy usta" },
});

module.exports = userHistorySchema;

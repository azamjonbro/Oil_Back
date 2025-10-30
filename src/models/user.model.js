const mongoose = require("mongoose");
const userHistorySchema = require("./user.history");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    carNumber: { type: String, required: true },
    carBrand: { type: String, required: true },
    history: [userHistorySchema],
    chatId:{type:String},
    cash:{type:Number, default:0},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clients", userSchema);

const express = require("express");
const router = express.Router();
const {
  createOrUpdateUser,
  getAllUsers,
  getUserById,
  getUserHistory,
  addHistory,
  deleteUser,
  decrementUserCashById,
  getUserPhoneById,
  resetUserCashById,
  getChatidById,
  updateChatId,
  getUserBalance
} = require("../controllers/user.controllers");

router.post("/", createOrUpdateUser);
router.get("/", getAllUsers);
router.get("/chatId", getChatidById);
router.put("/chatId", updateChatId);
router.get("/getballance", getUserBalance);
router.post("/phone", getUserPhoneById);
router.get("/:id", getUserById);
router.get("/:id/history", getUserHistory);
router.put("/:id", addHistory);
router.delete("/:id", deleteUser);
router.post("/:id/reset-cash", resetUserCashById);
router.post("/:id/decrement-cash", decrementUserCashById);

module.exports = router;

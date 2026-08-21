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
  getUserBalance,
  getUserOilHistory,
  confirmNotification,
  getClientStats,
  editUser
} = require("../controllers/user.controllers");
const data = require("../utils/notifyAdmin");

router.post("/", createOrUpdateUser);
router.get("/", getAllUsers);
router.get("/stats", getClientStats);
router.get("/chatId", getChatidById);
router.put("/chatId", updateChatId);
router.get("/getballance", getUserBalance);
router.post("/phone", getUserPhoneById);
router.get("/history", getUserOilHistory)
router.post("/:id/confirm-notification", confirmNotification);
router.get("/:id", getUserById);
router.get("/:id/history", getUserHistory);
router.put("/:id", addHistory);
router.put("/:id/edit", editUser);
router.delete("/:id", deleteUser);
router.post("/:id/reset-cash", resetUserCashById);
router.post("/:id/decrement-cash", decrementUserCashById);

router.post("/notify-admin", data.notifyPostAdminIfSelectDate)

module.exports = router;

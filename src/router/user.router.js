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
  updateChatId
} = require("../controllers/user.controllers");

router.post("/", createOrUpdateUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.get("/:id/history", getUserHistory);
router.put("/:id", addHistory);
router.delete("/:id", deleteUser);
router.post("/phone", getUserPhoneById);
router.post("/:id/reset-cash", resetUserCashById);
router.post("/:id/decrement-cash", decrementUserCashById);
router.get("/chatId", getChatidById);
router.put("/chatId", updateChatId);

module.exports = router;

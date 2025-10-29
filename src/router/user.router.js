const express = require("express");
const router = express.Router();
const {
  createOrUpdateUser,
  getAllUsers,
  getUserById,
  getUserHistory,
  addHistory,
  deleteUser,
} = require("../controllers/user.controllers");

router.post("/", createOrUpdateUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.get("/:id/history", getUserHistory);
router.put("/:id", addHistory);
router.delete("/:id", deleteUser);

module.exports = router;

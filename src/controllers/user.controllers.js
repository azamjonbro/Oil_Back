const User = require("../models/user.model");

// 🟢 CREATE yoki UPDATE USER
exports.createOrUpdateUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      carNumber,
      carBrand,
      klameter,
      oilBrand,
      filledAt,
      nextChangeAt,
      price,
      oilFilter,
      airFilter,
      cabinFilter,
      notificationDate,
    } = req.body;

    let user = await User.findOne({ name, carNumber });
    const historyItem = {
      klameter,
      oilBrand,
      filledAt,
      nextChangeAt,
      notificationDate,
      price,
      oilFilter,
      airFilter,
      cabinFilter,
    };

    if (user) {
      user.history.push(historyItem);
      await user.save();
      res.status(200).json(user);
    } else {
      user = new User({
        name,
        phone,
        carNumber,
        carBrand,
        history: [historyItem],
      });
      await user.save();
      res.status(201).json(user);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 🟢 GET BARCHA USERLAR
exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

// 🟢 GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Topilmadi" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 GET USER HISTORY
exports.getUserHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Topilmadi" });
    res.json(user.history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 ADD HISTORY ENTRY
exports.addHistory = async (req, res) => {
  const {
    filledAt,
    nextChangeAt,
    price,
    klameter,
    oilBrand,
    notificationDate,
    oilFilter,
    airFilter,
    cabinFilter,
  } = req.body;

  const historyItem = {
    filledAt,
    nextChangeAt,
    price,
    klameter,
    oilBrand,
    notificationDate,
    oilFilter,
    airFilter,
    cabinFilter,
  };

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Topilmadi" });
    user.history.push(historyItem);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 🟢 DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Topilmadi" });
    res.json({ message: "O‘chirildi ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

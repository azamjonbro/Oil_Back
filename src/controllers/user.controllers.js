const User = require("../models/user.model");


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
      DecreptedSumma,
      cost,
      master
    } = req.body;

    let user = await User.findOne({ name, carNumber });
    let priceNum = parseFloat(price) || 0;
    let decSum = parseFloat(DecreptedSumma) || 0;

    // hisoblash
    let sum = priceNum - decSum;
    sum = Math.round(sum * 0.01); // 1% ni olish
    
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
      cost: parseFloat(cost) || 0,
      master: master || "Asosiy usta"
    };

    if (user){
      if (phone) user.phone = phone;
      if (carBrand) user.carBrand = carBrand;

      user.history.push(historyItem);
      user.cash = (Number(user.cash) || 0) - decSum + sum;
      
      await user.save();
      res.status(200).json(user);
    } else {
      user = new User({
        name,
        phone,
        carNumber,
        carBrand,
        history: [historyItem],
        cash: sum
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


exports.getUserHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Topilmadi" });
    res.json(user.history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getUserOilHistory = async (req, res) => {
  console.log(req.params.id);
  
  try {
    const user = await User.findOne({
      chatId: req.query.chatId,
    });
    if (!user) return res.status(404).json({ error: "Topilmadi" });
    res.json(user.history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

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
    DecreptedSumma,
    cost,
    master
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
    cost: parseFloat(cost) || 0,
    master: master || "Asosiy usta"
  };

  try {

    const user = await User.findById(req.params.id);

    let priceNum = parseFloat(price) || 0;
    let decSum = parseFloat(DecreptedSumma) || 0;
    let sum = priceNum - decSum;
    sum = Math.round(sum * 0.01);

    if (!user) return res.status(404).json({ error: "Topilmadi" });
    
    user.history.push(historyItem);
    user.cash = (Number(user.cash) || 0) - decSum + sum;
    
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

//get phone 
exports.getUserPhoneById = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Telefon raqam yuborilmagan" });
    }

    console.log("📞 Request phone:", phone);

    // ✅ findById o‘rniga findOne ishlatamiz
    const user = await User.findOne({ phone: phone });

    if (!user) {
      return res.status(404).json({ message: "Topilmadi" });
    }

    res.json({
      exists: true,
      phone: user.phone,
      user: user
    });
  } catch (err) {
    console.error("❌ Backend error:", err.message);
    res.status(500).json({ error: err.message });
  }
};


//reset cash
exports.resetUserCashById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Topilmadi" });
    user.cash = 0;
    await user.save();
    res.json({message: "Cash reset qilindi ✅"});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//decrement cash
exports.decrementUserCashById = async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Topilmadi" });
    user.cash -= amount;
    if (user.cash < 0) user.cash = 0;
    await user.save();
    res.json({message: "Cash decrement qilindi ✅", cash: user.cash});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getChatidById = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID yuborilmagan" });
    }

    console.log("💬 Request ID:", id);
    const user = await User.findOne({ chatId: id });

    if (!user) {
      return res.status(404).json({ message: "Topilmadi" });
    }

    res.json({
      chatId: user.chatId
    });
  } catch (err) {
    console.error("❌ Backend error:", err.message);
    res.status(500).json({ error: err.message });
  }
};  


exports.updateChatId = async (req, res) => {
  try {
    const { userId, chatId } = req.body;

    if (!userId || !chatId) {
      return res.status(400).json({ error: "userId yoki chatId yuborilmagan" });
    }

    console.log("💬 Update Request userId:", userId, "chatId:", chatId);

    // _id bo‘yicha izlaymiz
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "Topilmadi" });

    user.chatId = chatId;
    await user.save();

    res.json({ message: "Chat ID yangilandi ✅", chatId: user.chatId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getUserBalance = async (req, res) => {
  try {
    const { chatId } = req.query;

    if (!chatId) {
      return res.status(400).json({ error: "ID yuborilmagan" });
    }
    console.log(req.query);
    
    const user = await User.findOne({chatId: chatId});
    console.log(user);
    
    if (!user) return res.status(404).json({ error: "Topilmadi" });

    res.json({ balance: user.cash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 CONFIRM NOTIFICATION
exports.confirmNotification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Topilmadi" });
    if (!user.history || user.history.length === 0) {
      return res.status(400).json({ error: "Servis tarixi topilmadi" });
    }

    const latest = user.history[user.history.length - 1];
    
    // Set notificationDate to nextChangeAt, or today + 30 days if nextChangeAt is invalid or has passed
    let nextDate = latest.nextChangeAt ? new Date(latest.nextChangeAt) : null;
    if (!nextDate || isNaN(nextDate.getTime()) || nextDate <= new Date()) {
      nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
    }

    latest.notificationDate = nextDate;
    await user.save();

    res.json({ message: "Notification tasdiqlandi ✅", notificationDate: latest.notificationDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 GET STATISTICS
exports.getClientStats = async (req, res) => {
  try {
    const users = await User.find();
    const totalClients = users.length;

    let needNotificationCount = 0;
    let todayCount = 0;
    let overdueCount = 0;
    let thisMonthCount = 0;
    let completedNotifications = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    users.forEach((user) => {
      if (!user.history || user.history.length === 0) return;
      const latest = user.history[user.history.length - 1];

      const notifDate = latest.notificationDate 
        ? new Date(latest.notificationDate) 
        : (latest.nextChangeAt ? new Date(latest.nextChangeAt) : null);
      const nextChange = latest.nextChangeAt ? new Date(latest.nextChangeAt) : null;

      // Check if notification is due: empty/missing notificationDate OR <= today
      const isDue = !notifDate || notifDate <= new Date();

      if (isDue) {
        needNotificationCount++;

        // Overdue if nextChangeAt has passed
        if (nextChange && nextChange < new Date()) {
          overdueCount++;
        }

        if (notifDate) {
          const d = new Date(notifDate);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() === today.getTime()) {
            todayCount++;
          }
          if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
            thisMonthCount++;
          }
        } else {
          // Empty notificationDate is treated as due today
          todayCount++;
        }
      } else {
        completedNotifications++;
      }
    });

    res.json({
      totalClients,
      needNotification: needNotificationCount,
      today: todayCount,
      overdue: overdueCount,
      thisMonth: thisMonthCount,
      completedNotifications,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 EDIT USER DETAILS
exports.editUser = async (req, res) => {
  try {
    const { name, phone, carNumber, carBrand } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ error: "Topilmadi" });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (carNumber) user.carNumber = carNumber;
    if (carBrand) user.carBrand = carBrand;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
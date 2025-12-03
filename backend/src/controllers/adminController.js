const users = [
  {
    id: "u1",
    username: "nat",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Free",
    joinedDate: "2025-07-10",
    status: "Active",
    lastActive: "2025-09-10",
  },
  {
    id: "u2",
    username: "odixe",
    email: "odi@gmail.com",
    level: 5,
    subscription: "Super",
    joinedDate: "2025-07-15",
    status: "Inactive",
    lastActive: "2025-09-08",
  },
];

const units = [
  {
    id: "unit1",
    title: "Lesson 1: Greetings",
    type: "Vocabulary",
    questionCount: 10,
  },
  {
    id: "unit2",
    title: "Lesson 2: Daily Activities",
    type: "Grammar",
    questionCount: 8,
  },
];

//  Lấy danh sách user
exports.getUsers = (req, res) => res.json(users);

// Lấy chi tiết 1 user
exports.getUserById = (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  user ? res.json(user) : res.status(404).json({ message: "User not found" });
};

// Cập nhật trạng thái
exports.updateStatus = (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.status = req.body.status;
  res.json({ message: "Status updated", user });
};

// Cập nhật gói subscription
exports.updateSubscription = (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.subscription = req.body.subscription;
  res.json({ message: "Subscription updated", user });
};

// Xoá user
exports.deleteUser = (req, res) => {
  const index = users.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "User not found" });
  users.splice(index, 1);
  res.json({ message: "User deleted" });
};

// Dashboard mock data
exports.getDashboardSummary = (req, res) => {
  res.json({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "Active").length,
    subscriptionStats: { free: 10, super: 5 },
    topActivities: [
      { name: "Listening Challenge", popularity: 88, plays: 540 },
      { name: "Grammar Quiz", popularity: 70, plays: 420 },
    ],
  });
};

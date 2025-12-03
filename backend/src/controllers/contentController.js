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

// Lấy danh sách Unit
exports.getUnits = (req, res) => res.json(units);

// Lấy chi tiết 1 Unit
exports.getUnitById = (req, res) => {
  const unit = units.find((u) => u.id === req.params.id);
  unit ? res.json(unit) : res.status(404).json({ message: "Unit not found" });
};

// Tạo Unit mới
exports.createUnit = (req, res) => {
  const { title, type, questionCount } = req.body;
  const newUnit = {
    id: "unit" + (units.length + 1),
    title,
    type,
    questionCount,
  };
  units.push(newUnit);
  res.status(201).json({ message: "Unit created", newUnit });
};

// Cập nhật Unit
exports.updateUnit = (req, res) => {
  const unit = units.find((u) => u.id === req.params.id);
  if (!unit) return res.status(404).json({ message: "Unit not found" });
  Object.assign(unit, req.body);
  res.json({ message: "Unit updated", unit });
};

// Xoá Unit
exports.deleteUnit = (req, res) => {
  const index = units.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Unit not found" });
  units.splice(index, 1);
  res.json({ message: "Unit deleted" });
};

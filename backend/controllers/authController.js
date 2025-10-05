const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const users = require("../models/User.js");

// Đăng ký
const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "Email đã tồn tại" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword,
    avatar: null,
    isVerified: true, // mock luôn là đã verify
  };

  users.push(newUser);

  res.status(201).json({
    message: "Đăng ký thành công",
    user: { id: newUser.id, name: newUser.name, email: newUser.email },
  });
};

// Đăng nhập
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "Người dùng không tồn tại" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Sai mật khẩu" });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({
    message: "Đăng nhập thành công",
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
};

// Mock tạm cho forgot/reset để tránh lỗi route
const forgotPassword = (req, res) => {
  res.json({ message: "Chức năng quên mật khẩu chưa được hỗ trợ (mock)" });
};

const resetPassword = (req, res) => {
  res.json({ message: "Chức năng reset mật khẩu chưa được hỗ trợ (mock)" });
};

const verifyEmail = (req, res) => {
  res.json({ message: "Chức năng xác minh email chưa được hỗ trợ (mock)" });
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
};

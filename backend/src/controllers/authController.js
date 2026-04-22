const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In-memory user store — no MongoDB needed
const users = new Map();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dealdish-dev-secret', { expiresIn: '30d' });

// POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password' });
  }
  if (users.has(email.toLowerCase())) {
    return res.status(400).json({ message: 'User already exists' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const id = `user-${Date.now()}`;
    const user = { _id: id, name, email: email.toLowerCase(), password: hashed };
    users.set(email.toLowerCase(), user);
    res.status(201).json({ _id: id, name, email: user.email, token: generateToken(id) });
  } catch {
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }
  try {
    const user = users.get(email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
  } catch {
    res.status(500).json({ message: 'Server error during login' });
  }
};

// GET /api/auth/me
const getMe = (req, res) => {
  res.status(200).json(req.user);
};

module.exports = { registerUser, loginUser, getMe };

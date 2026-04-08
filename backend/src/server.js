const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
// connectDB(); // Uncomment when MongoDB URI is set in .env

const app = express();
const server = http.createServer(app);

// Basic Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Init Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Pass io to request object (so it can be used in routes/controllers)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Example: join a specific room for user-specific notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/shopping-list', require('./routes/shoppingListRoutes'));
app.use('/api/recipes', require('./routes/recipeRoutes'));

app.get('/', (req, res) => {
  res.send('DealDish API is running!');
});

// Custom error handling middleware could go here

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

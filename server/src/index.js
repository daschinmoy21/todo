const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: 5432,
});

const waitForPostgres = async () => {
  let retries = 5;
  while (retries) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Database connected successfully');
      return true;
    } catch (err) {
      console.log(`Retrying database connection... (${retries} attempts remaining)`);
      retries -= 1;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
  }
  return false;
};

// Database initialization
const initDb = async () => {
  // Wait for PostgreSQL to be ready
  const isConnected = await waitForPostgres();
  if (!isConnected) {
    throw new Error('Unable to connect to the database');
  }

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lists (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Enhance users table
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS username VARCHAR(255),
      ADD COLUMN IF NOT EXISTS profile_picture TEXT,
      ADD COLUMN IF NOT EXISTS user_info TEXT;

      -- Board members table
      CREATE TABLE IF NOT EXISTS board_members (
        board_member_id SERIAL PRIMARY KEY,
        board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(board_id, user_id)
      );

      -- Card comments table
      CREATE TABLE IF NOT EXISTS card_comments (
        comment_id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Board chat messages table
      CREATE TABLE IF NOT EXISTS board_chat_messages (
        chat_message_id SERIAL PRIMARY KEY,
        board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        message_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add initial board member entry for board owners
      INSERT INTO board_members (board_id, user_id, role)
      SELECT id, user_id, 'owner'
      FROM boards
      WHERE NOT EXISTS (
        SELECT 1 FROM board_members 
        WHERE board_members.board_id = boards.id 
        AND board_members.user_id = boards.user_id
      );
    `);
    console.log('Database tables created successfully');
  } finally {
    client.release();
  }
};

initDb().catch(console.error);

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    // Check if username already exists
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, hashedPassword, username]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Registration error:', err);
    if (err.constraint === 'users_email_key') {
      res.status(400).json({ error: 'Email already registered' });
    } else {
      res.status(500).json({ error: 'Error creating user' });
    }
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        username: user.username 
      }, 
      process.env.JWT_SECRET
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Board routes
app.post('/api/boards', authenticateToken, async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO boards (title, user_id) VALUES ($1, $2) RETURNING *',
      [title, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating board' });
  }
});

app.get('/api/boards', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM boards WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching boards' });
  }
});

app.get('/api/boards/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM boards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching board' });
  }
});

// Get lists for a board
app.get('/api/boards/:boardId/lists', authenticateToken, async (req, res) => {
  try {
    const listsResult = await pool.query(
      `SELECT l.*,
        (SELECT json_agg(
          json_build_object(
            'id', t.id,
            'title', t.title,
            'description', t.description,
            'position', t.position,
            'created_at', t.created_at
          ) ORDER BY t.position
        )
        FROM tasks t
        WHERE t.list_id = l.id
        ) as tasks
       FROM lists l
       WHERE l.board_id = $1
       ORDER BY l.position`,
      [req.params.boardId]
    );
    
    const lists = listsResult.rows.map(list => ({
      ...list,
      tasks: list.tasks || []
    }));
    
    res.json(lists);
  } catch (err) {
    console.error('Error fetching lists:', err);
    res.status(500).json({ error: 'Error fetching lists' });
  }
});

// List routes
app.post('/api/boards/:boardId/lists', authenticateToken, async (req, res) => {
  const { title } = req.body;
  const { boardId } = req.params;
  
  try {
    // First verify the board belongs to the user
    const boardCheck = await pool.query(
      'SELECT id FROM boards WHERE id = $1 AND user_id = $2',
      [boardId, req.user.id]
    );

    if (boardCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Get the next position
    const position = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM lists WHERE board_id = $1',
      [boardId]
    );

    // Create the list
    const result = await pool.query(
      'INSERT INTO lists (title, board_id, position) VALUES ($1, $2, $3) RETURNING *',
      [title, boardId, position.rows[0].next_pos]
    );

    // Return the new list with an empty tasks array
    const newList = {
      ...result.rows[0],
      tasks: []
    };

    res.json(newList);
  } catch (err) {
    console.error('Error creating list:', err);
    res.status(500).json({ error: 'Error creating list' });
  }
});

// Task routes
app.post('/api/lists/:listId/tasks', authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  const { listId } = req.params;
  try {
    const position = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM tasks WHERE list_id = $1',
      [listId]
    );
    const result = await pool.query(
      'INSERT INTO tasks (title, description, list_id, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, listId, position.rows[0].next_pos]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating task' });
  }
});

// Add this new endpoint after the existing task routes
app.patch('/api/tasks/:taskId/move', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { destinationListId, newPosition } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update positions of other tasks in the destination list
    await client.query(
      `UPDATE tasks 
       SET position = position + 1
       WHERE list_id = $1 AND position >= $2`,
      [destinationListId, newPosition]
    );

    // Move the task to the new list and position
    const result = await client.query(
      `UPDATE tasks 
       SET list_id = $1, position = $2
       WHERE id = $3
       RETURNING *`,
      [destinationListId, newPosition, taskId]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error moving task:', err);
    res.status(500).json({ error: 'Error moving task' });
  } finally {
    client.release();
  }
});

// Add after existing routes

// Board Members routes
app.post('/api/boards/:boardId/members', authenticateToken, async (req, res) => {
  const { userId, role, title } = req.body;
  const { boardId } = req.params;

  try {
    // Check if user is board owner
    const boardCheck = await pool.query(
      `SELECT bm.role 
       FROM board_members bm
       WHERE bm.board_id = $1 AND bm.user_id = $2 AND bm.role = 'owner'`,
      [boardId, req.user.id]
    );

    if (boardCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only board owners can add members' });
    }

    const result = await pool.query(
      `INSERT INTO board_members (board_id, user_id, role, title)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [boardId, userId, role || 'member', title]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error adding board member' });
  }
});

// Card Comments routes
app.post('/api/tasks/:taskId/comments', authenticateToken, async (req, res) => {
  const { comment_text } = req.body;
  const { taskId } = req.params;

  try {
    // Check if user is board member
    const memberCheck = await pool.query(
      `SELECT bm.role 
       FROM board_members bm
       JOIN lists l ON l.board_id = bm.board_id
       JOIN tasks t ON t.list_id = l.id
       WHERE t.id = $1 AND bm.user_id = $2`,
      [taskId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only board members can comment' });
    }

    const result = await pool.query(
      `INSERT INTO card_comments (task_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, req.user.id, comment_text]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error adding comment' });
  }
});

// Board Chat Messages routes
app.post('/api/boards/:boardId/messages', authenticateToken, async (req, res) => {
  const { message_text } = req.body;
  const { boardId } = req.params;

  try {
    // Check if user is board member
    const memberCheck = await pool.query(
      `SELECT role FROM board_members 
       WHERE board_id = $1 AND user_id = $2`,
      [boardId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only board members can send messages' });
    }

    const result = await pool.query(
      `INSERT INTO board_chat_messages (board_id, user_id, message_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [boardId, req.user.id, message_text]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error sending message' });
  }
});

// User Profile routes
app.patch('/api/users/profile', authenticateToken, async (req, res) => {
  const { username, profile_picture, user_info } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           profile_picture = COALESCE($2, profile_picture),
           user_info = COALESCE($3, user_info)
       WHERE id = $4
       RETURNING id, email, username, profile_picture, user_info`,
      [username, profile_picture, user_info, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Get board members
app.get('/api/boards/:boardId/members', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bm.*, u.username, u.profile_picture
       FROM board_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.board_id = $1`,
      [req.params.boardId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching board members' });
  }
});

// Get task comments
app.get('/api/tasks/:taskId/comments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cc.*, u.username, u.profile_picture
       FROM card_comments cc
       JOIN users u ON u.id = cc.user_id
       WHERE cc.task_id = $1
       ORDER BY cc.created_at DESC`,
      [req.params.taskId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching comments' });
  }
});

// Get board messages
app.get('/api/boards/:boardId/messages', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bcm.*, u.username, u.profile_picture
       FROM board_chat_messages bcm
       JOIN users u ON u.id = bcm.user_id
       WHERE bcm.board_id = $1
       ORDER BY bcm.created_at ASC
       LIMIT 50`,
      [req.params.boardId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"]
  },
  transports: ['websocket', 'polling']
});

// Add debug logging for Socket.IO
io.engine.on("connection_error", (err) => {
  console.log("Connection error:", err);
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('Socket auth token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Socket auth error:', err);
        return next(new Error('Authentication error: Invalid token'));
      }
      console.log('Socket authenticated for user:', decoded.id);
      socket.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Socket middleware error:', error);
    next(new Error('Internal server error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'User ID:', socket.user?.id);

  socket.on('join-board', (boardId) => {
    console.log(`User ${socket.user.id} joining board ${boardId}`);
    socket.join(`board-${boardId}`);
  });

  socket.on('leave-board', (boardId) => {
    console.log(`User ${socket.user.id} leaving board ${boardId}`);
    socket.leave(`board-${boardId}`);
  });

  socket.on('board-message', async ({ boardId, message }) => {
    console.log(`Received message from user ${socket.user.id} for board ${boardId}:`, message);
    
    try {
      // Save message to database
      const result = await pool.query(
        `INSERT INTO board_chat_messages (board_id, user_id, message_text)
         VALUES ($1, $2, $3)
         RETURNING chat_message_id, message_text, created_at`,
        [boardId, socket.user.id, message]
      );

      // Get user information
      const userInfo = await pool.query(
        `SELECT username, profile_picture FROM users WHERE id = $1`,
        [socket.user.id]
      );

      const messageWithUser = {
        ...result.rows[0],
        username: userInfo.rows[0]?.username || 'Anonymous',
        profile_picture: userInfo.rows[0]?.profile_picture,
        user_id: socket.user.id
      };

      console.log('Broadcasting message with user info:', messageWithUser);
      io.to(`board-${boardId}`).emit('new-message', messageWithUser);
    } catch (err) {
      console.error('Error handling message:', err);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make sure board members are created when a board is created
app.post('/api/boards', authenticateToken, async (req, res) => {
  const { title } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const boardResult = await client.query(
      'INSERT INTO boards (title, user_id) VALUES ($1, $2) RETURNING *',
      [title, req.user.id]
    );
    
    // Add creator as board owner
    await client.query(
      'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)',
      [boardResult.rows[0].id, req.user.id, 'owner']
    );
    
    await client.query('COMMIT');
    res.json(boardResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating board:', err);
    res.status(500).json({ error: 'Error creating board' });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
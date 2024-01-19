const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const usersRouter = require('./router/usersRouter');
const friendsRouter = require('./router/friendsRouter');
const eventsRouter = require('./router/eventsRouter');
const postsRouter = require('./router/postsRouter');
const groupsRouter = require('./router/groupsRouter');
const chatRouter = require('./router/chatRouter');
const usersModels = require('./models/usersModel');
const cors = require('cors')
//const RateLimiter = require('./utils/rateLimiter'); 
const port = 3000;

dotenv.config();

const app = express();
app.use(bodyParser.json());

const corsOptions = {
  origin: ['https://canchu-for-backend.vercel.app',
  'https://canchu-for-backend.vercel.app'], // assign allowed origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], 
};
app.use(cors(corsOptions));
//app.use(cors()); //all

/*const rateLimiter = new RateLimiter(10, 1);
app.use(async (req, res, next) => {
  const ipAddress = req.headers['x-real_ip']; // Assuming the IP address is available through req.ip
  try {
    const isRateLimited = await rateLimiter.isRateLimited(ipAddress);
    if (isRateLimited) {
      return res.status(429).json({ error: 'Too Many Requests' });
    } else {
      next();
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});*/


// Register user router
app.use('/api/1.0/users', usersRouter);
app.use('/api/1.0/friends', friendsRouter);
app.use('/api/1.0/events', eventsRouter);
app.use('/api/1.0/posts', postsRouter);
app.use('/api/1.0/groups', groupsRouter);
app.use('/api/1.0/chat', chatRouter);

// Serve files from the 'public' directory under the '/static' virtual path
app.use('/static', express.static('public'));
// Add this middleware to trust the proxy's determination of the protocol
app.set('trust proxy', true);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Server Error' });
});


const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Listen for the termination event of the application
process.on('SIGINT', function() {
  /*server.close(function(err) {
    if (err) {
      console.error('Error closing server:', err);
      return;
    }
    console.log('Server closed.');
  });*/
  // Close the MySQL connection before terminating the application
  usersModels.connection.end(function(err) {
    if (err) {
      console.error('Error closing MySQL connection:', err);
      return;
    }
    console.log('MySQL connection closed.');
    process.exit(); // Terminate the application
  });
});
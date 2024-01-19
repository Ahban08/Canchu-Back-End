const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Generate JWT token
exports.generateJWTToken= (userId,usereEmail,userName,userPicture) => {
    const secretKey = process.env.SECRET; // Replace with your secret key
    const payload = { id: userId, email: usereEmail, name: userName, picture: userPicture };
    //console.log(payload);
    const token = jwt.sign(payload, secretKey, { expiresIn: '8h' }); // Expires in 8 hour
    return token;
}

// Middleware for verifying JWT token
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const pureToken = token.split(' ')[1];
    const decodedToken = jwt.verify(pureToken, process.env.SECRET);
    req.decodedToken = decodedToken;
    //console.log(decodedToken);
    next();
  } catch (error) {
    console.error(error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};


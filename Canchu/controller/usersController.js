const jwt = require('jsonwebtoken');
const usersModel = require('../models/usersModel');
const auth = require('../utils/auth');
const multer = require('multer');

// User Sign Up
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  // Check for empty fields
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields must be entered.' });
  }

  // Validate email format
  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    // Check if the email already exists
    const userExists = await usersModel.checkEmailExists(email);
    if (userExists) {
      return res.status(403).json({ error: 'Email already exists' });
    }

    // If the email does not exist, insert the user
    const results = await usersModel.insertUser(name, email, password);
    const accessToken = jwt.sign({ email, name }, process.env.SECRET, { expiresIn: '8h' });

    const responseData = {
      access_token: accessToken,
      user: {
        id: results.insertId,
        provider: 'native',
        name: name,
        email: email,
        picture: 'PictureURL',
      },
    };

    res.status(200).json({ data: responseData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// User Sign In
exports.signin = (req, res) => {
  // Extract provider, email, and password from the request body
  //const { provider, email, password, access_token } = req.body; //Access token from facebook
  const { provider, email, password } = req.body;
  /*test
  app.get('/', (req, res) => {
    res.status(200).json({hello: `${provider}'+'${email}`})
  })*/

  // Validate the request body
  if (provider === 'native') {
    // Validate native email/password authentication
    if (email && password) {
      // Perform validation against your user database

      usersModel.validateNativeCredentials(email, password)
        .then(results => {
          // Extract the values from the results
          const { id, name, picture } = results[0];
          // Generate JWT token
          const token = auth.generateJWTToken(id, email, name, picture);

          // Construct the success response
          const response = {
            data: {
              access_token: token,
              user: {
                id: id,
                provider: provider,
                name: name,
                email: email,
                picture: picture
              }
            }
          };

          // Respond with the success response
          res.status(200).json(response);
        })
        .catch(error => {
          // Handle the error
          console.error('Validation failed:', error);
          // Respond with a sign-in failed error (wrong password or user not found)
          res.status(403).json({ error: 'Sign In Failed: Wrong password or user not found' });
        });
    } else {
      // Respond with a client error (bad request)
      res.status(400).json({ error: 'Bad Request: Email and password are required for native sign-in' });
    }
  } else {
    // Respond with a client error (bad request)
    res.status(400).json({ error: 'Bad Request: Invalid provider' });
  }
};

// Get User Profile
exports.getUserProfile = (req, res) => {
    const searchUserId = parseInt(req.params.id, 10);
    const token = req.decodedToken;
    const userId = token.id;
    if (!isNaN(searchUserId)) {
      // Use searchUserId as an integer
      try {
        // Query the user profile information based on the user ID
        usersModel.getUserProfileById(searchUserId, userId, "friend")
          .then(results => {
            if (results.ProfileDetail.length > 0) {
              let friendship = null;
              if(results.Friendship[0] !== undefined){
                friendship = {
                  id: results.Friendship[0].id,
                  status: results.Friendship[0].status
                }
              }
              const userProfile = {
                id: results.ProfileDetail[0].id,
                name: results.ProfileDetail[0].name,
                picture: results.ProfileDetail[0].picture,
                friend_count: results.FriendCount,
                introduction: results.ProfileDetail[0].introduction,
                tags: results.ProfileDetail[0].tags,
                friendship: friendship
              };
              res.status(200).json({ data: { user: userProfile } });
            } else {
              res.status(400).json({ error: 'User profile not found' });
            }
          })
          .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
          });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    } else {
      // Handle the case where req.params.id is not a valid number
      res.status(400).json({ error: 'Invalid user ID' });
    }
};

// Update User Profile
exports.updateUserProfile = (req, res) => {
  //auth.verifyToken
  const token = req.headers.authorization;
  //const token = req.header("Authorization").replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    //console.log(token);
    const pure_token = token.split(' ')[1]
    //console.log(pure_token)
    //console.log(process.env.SECRET)
    jwt.verify(pure_token, process.env.SECRET, function (err, decoded) {
      if (err) {
        // Handle token verification error
        console.error(err);
        res.status(403).json({ error: 'Invalid token' });
      } else {
        console.log(decoded);
        req.user = decoded;
      }
    });
    // Token decoding successful
  } catch (error) {
    console.error(error);
    return res.status(403).json({ error: 'Invalid token' });
    // Handle the error appropriately
  }

  const { name, introduction, tags } = req.body;
  // Check if the 'email' property exists in the request object
  console.log(req.user);
  if (!req.user || !req.user.email) {
    return res.status(400).json({ error: 'Invalid user email' });
  }
  // Update user profile information based on the provided fields
  // Update the required fields in the database
  //const userEmail  = req.user.email;
  const userid  = req.user.id;
  usersModel.findByIdAndUpdate(userid, { name, introduction, tags })
    .then(results => {
      res.status(200).json({ data: { user: { id: results } } });
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    });
};

// Update User Picture
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'public/images',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });
// Handle user picture update
exports.updateUserPicture = (req, res) => {
  upload.single('picture')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer error occurred
      console.error('Multer Error:', err);
      return res.status(400).json({ error: 'File upload error' });
    } else if (err) {
      // Other error occurred
      console.error('Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    const image = req.file;
    const userId = req.decodedToken;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }else{
      const currentWebpageAddress = 'https://' + req.get('host'); //req.protocol + '://' + req.get('host');
      const imageUrl = `${currentWebpageAddress}/static/images/${image.originalname}`;
      usersModel.pictureUpdate(imageUrl, userId)
      .then(() =>{
        res.json({ data: { picture: imageUrl } });
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      });
    }
  });
};

// Get User Profile
exports.search = (req, res) => {
  const keyword = req.query.keyword;
  const token = req.decodedToken;
  const userId = token.id;
  usersModel.searchByKeyword(userId,keyword)
    .then(results => {
      if (results.length > 0) {
        const promises = results.map(async result => {
          const userProfile = {
            id: result.id,
            name: result.name,
            picture: result.picture,
            friendship: result.friendId === null ? null :{
              id: result.friendId,
              status: result.status
            }
          };
          return userProfile;
        });
        Promise.all(promises)
          .then(friends => {
            res.status(200).json({ data: { users: friends } });
          })
          .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
          });
      } else {
        res.status(400).json({ error: 'Not found' });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    });
};

/*// sum.js
exports.sum = (a, b) => {
  return a + b;
}*/
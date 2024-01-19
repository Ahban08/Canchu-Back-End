const express = require('express');
const router = express.Router();
const usersController = require('../controller/usersController');
const auth = require('../utils/auth');
//const upload = require('../utils/upload');

// User Sign Up API endpoint
router.post('/signup', usersController.signup);

// User Sign-in endpoint
router.post('/signin', usersController.signin);

// User Profile API
router.get('/:id/profile', auth.verifyToken, usersController.getUserProfile);

// User Profile Update API
router.put('/profile', usersController.updateUserProfile);

// User Picture Update API
//router.put('/picture', auth.verifyToken, upload.single('picture'), userController.updateUserPicture);
router.put('/picture', auth.verifyToken, usersController.updateUserPicture);

// User Search API
router.get('/search', auth.verifyToken, usersController.search);

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');
const postsController = require('../controller/postsController');

// Posts Created API
router.post('/', auth.verifyToken, postsController.createPost);

// Posts Updated API
router.put('/:id', auth.verifyToken, postsController.updatePost);

// Posts Create Like API
router.post('/:id/like', auth.verifyToken, postsController.createLike);

// Posts Delete Like API
router.delete('/:id/like', auth.verifyToken, postsController.deleteLike);

// Posts Create Like API
router.post('/:id/comment', auth.verifyToken, postsController.createComment);

// Posts Search API
router.get('/search', auth.verifyToken, postsController.search);

// Posts Detail API
router.get('/:id', auth.verifyToken, postsController.getDetail);


module.exports = router;

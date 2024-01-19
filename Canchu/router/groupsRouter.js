const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');
const groupsController = require('../controller/groupsController');

// POST groups
router.post('/', auth.verifyToken, groupsController.createGroup);

// DELETE groups
router.delete('/:group_id', auth.verifyToken, groupsController.deleteGroup);

// POST groups member
router.post('/:group_id/join', auth.verifyToken, groupsController.sendMemberRequest);

// Get groups pending request
router.get('/:group_id/member/pending', auth.verifyToken, (req, res) => {
    const status = 'pending';
    groupsController.getPendingRequests(req, res, status);
});

// POST agree groups request
router.post('/:group_id/member/:user_id/agree', auth.verifyToken, groupsController.agreeMemberRequest);

// POST groups post
router.post('/:group_id/post', auth.verifyToken, groupsController.createPost);

// Get groups post desc
router.get('/:group_id/posts', auth.verifyToken, groupsController.getPosts);

module.exports = router;

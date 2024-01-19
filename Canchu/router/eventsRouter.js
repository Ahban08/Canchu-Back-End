const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');
const eventsController = require('../controller/eventsController');

// Events API
/*router.get('/', auth.verifyToken, (req, res) => {
    const status = 'friend'; 
    eventsController.getEvents(req, res, status);
});*/
router.get('/', auth.verifyToken, eventsController.getEventsData);

// Read Events API
router.post('/:event_id/read', auth.verifyToken, eventsController.readEvents);

module.exports = router;

const eventsModel = require('../models/eventsModel');
const auth = require('../utils/auth');

//Set Timezone
const moment = require('moment-timezone'); 
moment.tz.setDefault("Asia/Taipei");

// Get Events
exports.getEventsData = (req, res) => {
  // Retrieve user's events from the database
  const userId = req.decodedToken.id;
  eventsModel.getEventsByUserId(userId)
    .then(eventList => {
      if(eventList.length == 0) {
          res.status(200).json({message: 'No notifications'});
      }
      else{
        const promises = eventList.map(async result => {
          const taipeiDateTime = moment.utc(result.created_at).tz('Asia/Taipei');
          const formattedDateTime = taipeiDateTime.format('YYYY-MM-DD HH:mm:ss');
          const content = {
            id: result.id,
            type: result.type,
            is_read: result.is_read,
            image: result.image,
            created_at: formattedDateTime,
            summary: result.summary
          };
          return content;
        });
        Promise.all(promises)
          .then(contents => {
            res.status(200).json({ data: { events: contents } });
          })
          .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
          });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    });

};

//Read Events
exports.readEvents = (req, res) => {
  const eventId = parseInt(req.params.event_id, 10);
  const senderId = req.decodedToken.id;
  if (!isNaN(eventId)) {
    // Check if the event id is valid and exists in the system
    eventsModel.getEventsById(eventId, senderId)
      .then(eventExists => {
        if (eventExists == 0) {
          res.status(400).json({ error: 'Notification is not found' });
        } else {
          // Check if the friendship request already exists
          eventsModel.updateEventsIsRead(true, eventId)
            .then(results => {
              const response = {
                data: {
                  event: {
                    id: eventId
                  }
                }
              };
              res.status(200).json(response);
            })
            .catch(error => {
              console.error(error);
              res.status(500).json({ error: 'Server error' });
            });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid user ID' });
  }

};

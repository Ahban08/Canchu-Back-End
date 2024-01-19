const chatModel = require('../models/chatModel');
const base64Util = require('../utils/base64Utils');

//Set Timezone
const moment = require('moment-timezone'); 
moment.tz.setDefault("Asia/Taipei");

// Create a new group
exports.createMessage = async (req, res) => {
    const { message } = req.body;
    const userId = req.decodedToken.id;
    const receiverId = parseInt(req.params.user_id, 10);
    if (!isNaN(receiverId)) {
        if (message){
            chatModel.insertMessage(message, userId, receiverId)
                .then(results => {
                    const response = {
                    data: {
                        message: {
                            id: results.insertId
                            }
                    }
                    };
                    res.status(200).json(response);
                })
                .catch(error => {
                    console.error(error);
                    res.status(500).json({ error: 'Server error' });
                });
        }else {
            res.status(400).json({ error: 'Message is empty.' });
        }
    } else {
        res.status(400).json({ error: 'Invalid chat user ID' });
    }    
};

// search Messages
exports.searchMessages = (req, res) => {
    const cursor = req.query.cursor;
    const token = req.decodedToken;
    const userId = token.id;
    const receiverId = parseInt(req.params.user_id, 10);
    // Decode the cursor parameter if provided
    const decodedCursor = cursor ? base64Util.decodeBase64(cursor) : null;
    if (!isNaN(receiverId)) {
        chatModel.searchByUserIdOrCursor(userId, receiverId, decodedCursor, 10)
            .then(messageListAndNextCursor => {
                const promises = messageListAndNextCursor.results.map(async messageResult => {
                    const taipeiDateTime = moment.utc(messageResult.created_at).tz('Asia/Taipei');
                    const formattedDateTime = taipeiDateTime.format('YYYY-MM-DD HH:mm:ss');
                    const content = {
                        id: messageResult.id,
                        message: messageResult.message,
                        created_at: formattedDateTime,
                        user:{
                            id: messageResult.senderId,
                            picture: messageResult.picture,
                            name: messageResult.name
                        }
                    };
                    return content;
            });
            const nextCursor = messageListAndNextCursor.nextCursor;
            const encodeCursor = nextCursor ? base64Util.encodeBase64(nextCursor.toString()) : null;
            Promise.all(promises)
                .then(messagesResult => {
                const response = {
                    data: {
                        messages: messagesResult,
                        next_cursor: encodeCursor
                    },
                };
                res.status(200).json(response);
                })
                .catch(error => {
                console.error(error);
                res.status(500).json({ error: 'Server error' });
                });

            })
            .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
            });
    } else {
        res.status(400).json({ error: 'Invalid chat user ID' });
    }  
  };